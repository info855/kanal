import socketio
from database import db
from datetime import datetime
import uuid

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Store active connections
active_sessions = {}  # {session_id: {'user_sid': sid, 'agent_sid': sid}}

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    # Remove from active sessions
    for session_id, sids in list(active_sessions.items()):
        if sids.get('user_sid') == sid or sids.get('agent_sid') == sid:
            del active_sessions[session_id]

# User starts chat
@sio.event
async def start_chat(sid, data):
    try:
        user_id = data.get('userId')
        user_name = data.get('userName')
        user_email = data.get('userEmail')
        
        # Check if user has an active session
        existing_session = await db.chat_sessions.find_one({
            'userId': user_id,
            'status': {'$in': ['waiting', 'active']}
        })
        
        if existing_session:
            session_id = existing_session['_id']
        else:
            # Create new session
            session_id = str(uuid.uuid4())
            session = {
                '_id': session_id,
                'userId': user_id,
                'userName': user_name,
                'userEmail': user_email,
                'agentId': None,
                'agentName': None,
                'status': 'waiting',
                'startedAt': datetime.utcnow(),
                'endedAt': None,
                'lastMessageAt': datetime.utcnow()
            }
            await db.chat_sessions.insert_one(session)
            
            # Send welcome bot message
            bot_message_id = str(uuid.uuid4())
            bot_message = {
                '_id': bot_message_id,
                'sessionId': session_id,
                'sender': 'bot',
                'senderName': 'Bot',
                'text': f'Merhaba {user_name}! Size nasıl yardımcı olabiliriz? Bir temsilci en kısa sürede sizinle iletişime geçecektir.',
                'timestamp': datetime.utcnow(),
                'read': False
            }
            await db.chat_messages.insert_one(bot_message)
            bot_message['_id'] = bot_message_id
            
            # Notify all agents about new session
            await sio.emit('new_session', {
                'sessionId': session_id,
                'userName': user_name,
                'userEmail': user_email
            }, room='agents')
        
        # Add user to active sessions
        if session_id not in active_sessions:
            active_sessions[session_id] = {}
        active_sessions[session_id]['user_sid'] = sid
        
        # Get messages
        messages_cursor = db.chat_messages.find({'sessionId': session_id}).sort('timestamp', 1)
        messages = await messages_cursor.to_list(length=100)
        for msg in messages:
            msg['_id'] = str(msg['_id'])
        
        await sio.emit('chat_started', {
            'sessionId': session_id,
            'messages': messages
        }, room=sid)
        
    except Exception as e:
        print(f"Error in start_chat: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

# Agent joins room
@sio.event
async def agent_join(sid, data):
    try:
        agent_id = data.get('agentId')
        agent_name = data.get('agentName')
        
        # Join agents room
        await sio.enter_room(sid, 'agents')
        
        # Get all active sessions
        sessions_cursor = db.chat_sessions.find({
            'status': {'$in': ['waiting', 'active']}
        }).sort('lastMessageAt', -1)
        sessions = await sessions_cursor.to_list(length=100)
        
        for session in sessions:
            session['_id'] = str(session['_id'])
        
        await sio.emit('agent_sessions', {'sessions': sessions}, room=sid)
        
    except Exception as e:
        print(f"Error in agent_join: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

# Agent takes session
@sio.event
async def agent_take_session(sid, data):
    try:
        session_id = data.get('sessionId')
        agent_id = data.get('agentId')
        agent_name = data.get('agentName')
        
        # Update session
        await db.chat_sessions.update_one(
            {'_id': session_id},
            {
                '$set': {
                    'agentId': agent_id,
                    'agentName': agent_name,
                    'status': 'active',
                    'lastMessageAt': datetime.utcnow()
                }
            }
        )
        
        # Add agent to active sessions
        if session_id not in active_sessions:
            active_sessions[session_id] = {}
        active_sessions[session_id]['agent_sid'] = sid
        
        # Notify user
        user_sid = active_sessions.get(session_id, {}).get('user_sid')
        if user_sid:
            await sio.emit('agent_joined', {
                'agentName': agent_name
            }, room=user_sid)
        
        # Get messages
        messages_cursor = db.chat_messages.find({'sessionId': session_id}).sort('timestamp', 1)
        messages = await messages_cursor.to_list(length=100)
        for msg in messages:
            msg['_id'] = str(msg['_id'])
        
        await sio.emit('session_taken', {
            'sessionId': session_id,
            'messages': messages
        }, room=sid)
        
    except Exception as e:
        print(f"Error in agent_take_session: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

# Send message
@sio.event
async def send_message(sid, data):
    try:
        session_id = data.get('sessionId')
        sender = data.get('sender')  # 'user' or 'agent'
        sender_name = data.get('senderName')
        text = data.get('text')
        
        # Save message
        message_id = str(uuid.uuid4())
        message = {
            '_id': message_id,
            'sessionId': session_id,
            'sender': sender,
            'senderName': sender_name,
            'text': text,
            'timestamp': datetime.utcnow(),
            'read': False
        }
        await db.chat_messages.insert_one(message)
        
        # Update session last message time
        await db.chat_sessions.update_one(
            {'_id': session_id},
            {'$set': {'lastMessageAt': datetime.utcnow()}}
        )
        
        message['_id'] = message_id
        
        # Send to both user and agent
        session_sids = active_sessions.get(session_id, {})
        user_sid = session_sids.get('user_sid')
        agent_sid = session_sids.get('agent_sid')
        
        if user_sid:
            await sio.emit('new_message', message, room=user_sid)
        if agent_sid:
            await sio.emit('new_message', message, room=agent_sid)
        
    except Exception as e:
        print(f"Error in send_message: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

# Close session
@sio.event
async def close_session(sid, data):
    try:
        session_id = data.get('sessionId')
        
        # Update session
        await db.chat_sessions.update_one(
            {'_id': session_id},
            {
                '$set': {
                    'status': 'closed',
                    'endedAt': datetime.utcnow()
                }
            }
        )
        
        # Notify both parties
        session_sids = active_sessions.get(session_id, {})
        user_sid = session_sids.get('user_sid')
        agent_sid = session_sids.get('agent_sid')
        
        if user_sid:
            await sio.emit('session_closed', {'sessionId': session_id}, room=user_sid)
        if agent_sid:
            await sio.emit('session_closed', {'sessionId': session_id}, room=agent_sid)
        
        # Remove from active sessions
        if session_id in active_sessions:
            del active_sessions[session_id]
        
    except Exception as e:
        print(f"Error in close_session: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)
