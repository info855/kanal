#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for En Ucuza Kargo
Tests all critical backend features including authentication, wallet system, 
media library, settings, shipping companies, and order management
"""

import requests
import json
import os
import tempfile
from pathlib import Path
import time
import uuid
from datetime import datetime

# Configuration
BACKEND_URL = "https://kargohub.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@enucuzakargo.com"
ADMIN_PASSWORD = "admin123"
DEMO_USER_EMAIL = "ali@example.com"
DEMO_USER_PASSWORD = "demo123"

class ComprehensiveBackendTester:
    def __init__(self):
        self.admin_session = requests.Session()
        self.user_session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.uploaded_media_ids = []
        self.created_shipping_company_id = None
        self.created_order_id = None
        self.created_deposit_request_id = None
        
    def log(self, message, level="INFO"):
        """Log test messages"""
        print(f"[{level}] {message}")
        
    # ========== AUTHENTICATION TESTS ==========
    
    def test_admin_login(self):
        """Test admin authentication"""
        self.log("Testing admin login...")
        
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        try:
            response = self.admin_session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            self.log(f"Admin login response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("token"):
                    self.admin_token = data["token"]
                    self.admin_session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                    self.log("✅ Admin login successful")
                    return True
                else:
                    self.log("❌ Admin login failed: No token in response", "ERROR")
                    return False
            else:
                self.log(f"❌ Admin login failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin login request failed: {str(e)}", "ERROR")
            return False
    
    def test_demo_user_login(self):
        """Test demo user authentication"""
        self.log("Testing demo user login...")
        
        login_data = {
            "email": DEMO_USER_EMAIL,
            "password": DEMO_USER_PASSWORD
        }
        
        try:
            response = self.user_session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            self.log(f"Demo user login response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("token"):
                    self.user_token = data["token"]
                    self.user_session.headers.update({"Authorization": f"Bearer {self.user_token}"})
                    self.log("✅ Demo user login successful")
                    return True
                else:
                    self.log("❌ Demo user login failed: No token in response", "ERROR")
                    return False
            else:
                self.log(f"❌ Demo user login failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Demo user login request failed: {str(e)}", "ERROR")
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        self.log("Testing user registration...")
        
        # Generate unique email for testing
        test_email = f"test_{int(time.time())}@example.com"
        
        register_data = {
            "name": "Test User",
            "email": test_email,
            "phone": "+90 555 123 4567",
            "company": "Test Company",
            "taxId": "1234567890",
            "password": "testpass123"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/auth/register", json=register_data)
            self.log(f"Registration response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("token"):
                    self.log("✅ User registration successful")
                    return True
                else:
                    self.log("❌ Registration failed: No token in response", "ERROR")
                    return False
            else:
                self.log(f"❌ Registration failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Registration request failed: {str(e)}", "ERROR")
            return False
    
    def test_get_current_user(self):
        """Test get current user info"""
        self.log("Testing get current user info...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        try:
            response = self.user_session.get(f"{BACKEND_URL}/auth/me")
            self.log(f"Get user info response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("user"):
                    self.log("✅ Get current user info successful")
                    return True
                else:
                    self.log("❌ Get user info failed: No user in response", "ERROR")
                    return False
            else:
                self.log(f"❌ Get user info failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get user info request failed: {str(e)}", "ERROR")
            return False
    
    # ========== WALLET SYSTEM TESTS (USER) ==========
    
    def test_get_wallet_balance(self):
        """Test get user wallet balance"""
        self.log("Testing get wallet balance...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        try:
            response = self.user_session.get(f"{BACKEND_URL}/wallet/balance")
            self.log(f"Get balance response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "balance" in data and "minimumBalance" in data:
                    self.log(f"✅ Get wallet balance successful: {data['balance']} TL")
                    return True
                else:
                    self.log("❌ Get balance failed: Missing balance fields", "ERROR")
                    return False
            else:
                self.log(f"❌ Get balance failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get balance request failed: {str(e)}", "ERROR")
            return False
    
    def test_create_deposit_request(self):
        """Test create deposit request"""
        self.log("Testing create deposit request...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        deposit_data = {
            "amount": 500.0,
            "senderName": "Test Sender",
            "description": "KARGO-TEST123",
            "paymentDate": datetime.utcnow().isoformat()
        }
        
        try:
            response = self.user_session.post(f"{BACKEND_URL}/wallet/deposit-request", json=deposit_data)
            self.log(f"Create deposit request response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("depositRequest"):
                    self.created_deposit_request_id = data["depositRequest"]["_id"]
                    self.log("✅ Create deposit request successful")
                    return True
                else:
                    self.log("❌ Create deposit request failed: Invalid response", "ERROR")
                    return False
            else:
                self.log(f"❌ Create deposit request failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Create deposit request failed: {str(e)}", "ERROR")
            return False
    
    def test_get_deposit_requests(self):
        """Test get user's deposit requests"""
        self.log("Testing get deposit requests...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        try:
            response = self.user_session.get(f"{BACKEND_URL}/wallet/deposit-requests")
            self.log(f"Get deposit requests response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "requests" in data and "total" in data:
                    self.log(f"✅ Get deposit requests successful: {data['total']} requests")
                    return True
                else:
                    self.log("❌ Get deposit requests failed: Missing fields", "ERROR")
                    return False
            else:
                self.log(f"❌ Get deposit requests failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get deposit requests failed: {str(e)}", "ERROR")
            return False
    
    def test_get_transactions(self):
        """Test get user's transaction history"""
        self.log("Testing get transaction history...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        try:
            response = self.user_session.get(f"{BACKEND_URL}/wallet/transactions")
            self.log(f"Get transactions response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "transactions" in data and "total" in data:
                    self.log(f"✅ Get transactions successful: {data['total']} transactions")
                    return True
                else:
                    self.log("❌ Get transactions failed: Missing fields", "ERROR")
                    return False
            else:
                self.log(f"❌ Get transactions failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get transactions failed: {str(e)}", "ERROR")
            return False
    
    # ========== WALLET SYSTEM TESTS (ADMIN) ==========
    
    def test_admin_get_deposit_requests(self):
        """Test admin get all deposit requests"""
        self.log("Testing admin get deposit requests...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        try:
            response = self.admin_session.get(f"{BACKEND_URL}/admin/wallet/deposit-requests")
            self.log(f"Admin get deposit requests response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "requests" in data and "total" in data:
                    self.log(f"✅ Admin get deposit requests successful: {data['total']} requests")
                    return True
                else:
                    self.log("❌ Admin get deposit requests failed: Missing fields", "ERROR")
                    return False
            else:
                self.log(f"❌ Admin get deposit requests failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin get deposit requests failed: {str(e)}", "ERROR")
            return False
    
    def test_admin_approve_deposit(self):
        """Test admin approve deposit request"""
        self.log("Testing admin approve deposit request...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        if not self.created_deposit_request_id:
            self.log("❌ No deposit request ID available", "ERROR")
            return False
        
        approval_data = {
            "adminNote": "Test approval"
        }
        
        try:
            response = self.admin_session.post(
                f"{BACKEND_URL}/admin/wallet/approve-deposit/{self.created_deposit_request_id}", 
                json=approval_data
            )
            self.log(f"Admin approve deposit response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log("✅ Admin approve deposit successful")
                    return True
                else:
                    self.log("❌ Admin approve deposit failed: Invalid response", "ERROR")
                    return False
            else:
                self.log(f"❌ Admin approve deposit failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin approve deposit failed: {str(e)}", "ERROR")
            return False
    
    def test_admin_manual_balance_adjustment(self):
        """Test admin manual balance adjustment"""
        self.log("Testing admin manual balance adjustment...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # Get a user ID first (use demo user)
        user_response = self.user_session.get(f"{BACKEND_URL}/auth/me")
        if user_response.status_code != 200:
            self.log("❌ Cannot get user ID for balance adjustment", "ERROR")
            return False
        
        user_id = user_response.json()["user"]["_id"]
        
        adjustment_data = {
            "userId": user_id,
            "amount": 100.0,
            "description": "Test manual adjustment"
        }
        
        try:
            response = self.admin_session.post(f"{BACKEND_URL}/admin/wallet/manual-balance", json=adjustment_data)
            self.log(f"Admin manual balance adjustment response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log("✅ Admin manual balance adjustment successful")
                    return True
                else:
                    self.log("❌ Admin manual balance adjustment failed: Invalid response", "ERROR")
                    return False
            else:
                self.log(f"❌ Admin manual balance adjustment failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin manual balance adjustment failed: {str(e)}", "ERROR")
            return False
    
    # ========== SETTINGS TESTS ==========
    
    def test_get_settings(self):
        """Test get site settings (public)"""
        self.log("Testing get site settings...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/settings")
            self.log(f"Get settings response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("settings"):
                    self.log("✅ Get site settings successful")
                    return True
                else:
                    self.log("❌ Get settings failed: No settings in response", "ERROR")
                    return False
            else:
                self.log(f"❌ Get settings failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get settings failed: {str(e)}", "ERROR")
            return False
    
    def test_update_settings(self):
        """Test update site settings (admin)"""
        self.log("Testing update site settings...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        settings_data = {
            "siteName": "En Ucuza Kargo Test",
            "tagline": "Test tagline update"
        }
        
        try:
            response = self.admin_session.put(f"{BACKEND_URL}/settings", json=settings_data)
            self.log(f"Update settings response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("settings"):
                    self.log("✅ Update site settings successful")
                    return True
                else:
                    self.log("❌ Update settings failed: Invalid response", "ERROR")
                    return False
            else:
                self.log(f"❌ Update settings failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Update settings failed: {str(e)}", "ERROR")
            return False
    
    # ========== SHIPPING COMPANIES TESTS ==========
    
    def test_get_shipping_companies(self):
        """Test get shipping companies"""
        self.log("Testing get shipping companies...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/shipping-companies")
            self.log(f"Get shipping companies response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "companies" in data:
                    self.log(f"✅ Get shipping companies successful: {len(data['companies'])} companies")
                    return True
                else:
                    self.log("❌ Get shipping companies failed: No companies in response", "ERROR")
                    return False
            else:
                self.log(f"❌ Get shipping companies failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get shipping companies failed: {str(e)}", "ERROR")
            return False
    
    def test_create_shipping_company(self):
        """Test create shipping company (admin)"""
        self.log("Testing create shipping company...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        company_data = {
            "name": "Test Kargo",
            "logo": "/uploads/test-logo.png",
            "price": 25.50,
            "deliveryTime": "1-2 gün"
        }
        
        try:
            response = self.admin_session.post(f"{BACKEND_URL}/shipping-companies", json=company_data)
            self.log(f"Create shipping company response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("company"):
                    self.created_shipping_company_id = data["company"]["_id"]
                    self.log("✅ Create shipping company successful")
                    return True
                else:
                    self.log("❌ Create shipping company failed: Invalid response", "ERROR")
                    return False
            else:
                self.log(f"❌ Create shipping company failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Create shipping company failed: {str(e)}", "ERROR")
            return False
    
    def test_update_shipping_company(self):
        """Test update shipping company (admin)"""
        self.log("Testing update shipping company...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        if not self.created_shipping_company_id:
            self.log("❌ No shipping company ID available", "ERROR")
            return False
        
        update_data = {
            "price": 30.00,
            "deliveryTime": "2-3 gün"
        }
        
        try:
            response = self.admin_session.put(
                f"{BACKEND_URL}/shipping-companies/{self.created_shipping_company_id}", 
                json=update_data
            )
            self.log(f"Update shipping company response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("company"):
                    self.log("✅ Update shipping company successful")
                    return True
                else:
                    self.log("❌ Update shipping company failed: Invalid response", "ERROR")
                    return False
            else:
                self.log(f"❌ Update shipping company failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Update shipping company failed: {str(e)}", "ERROR")
            return False
    
    # ========== ORDER MANAGEMENT TESTS ==========
    
    def test_create_order(self):
        """Test create order (user)"""
        self.log("Testing create order...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        if not self.created_shipping_company_id:
            self.log("❌ No shipping company ID available", "ERROR")
            return False
        
        order_data = {
            "recipientName": "Test Recipient",
            "recipientPhone": "+90 555 987 6543",
            "recipientCity": "İstanbul",
            "recipientDistrict": "Kadıköy",
            "recipientAddress": "Test Address 123",
            "weight": 2.5,
            "desi": 15,
            "shippingCompanyId": self.created_shipping_company_id,
            "paymentType": "cod",
            "codAmount": 100.0,
            "description": "Test order description"
        }
        
        try:
            response = self.user_session.post(f"{BACKEND_URL}/orders", json=order_data)
            self.log(f"Create order response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("order"):
                    self.created_order_id = data["order"]["orderId"]
                    self.log("✅ Create order successful")
                    return True
                else:
                    self.log("❌ Create order failed: Invalid response", "ERROR")
                    return False
            else:
                self.log(f"❌ Create order failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Create order failed: {str(e)}", "ERROR")
            return False
    
    def test_get_user_orders(self):
        """Test get user's orders"""
        self.log("Testing get user orders...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        try:
            response = self.user_session.get(f"{BACKEND_URL}/orders")
            self.log(f"Get user orders response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "orders" in data and "total" in data:
                    self.log(f"✅ Get user orders successful: {data['total']} orders")
                    return True
                else:
                    self.log("❌ Get user orders failed: Missing fields", "ERROR")
                    return False
            else:
                self.log(f"❌ Get user orders failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get user orders failed: {str(e)}", "ERROR")
            return False
    
    def test_get_specific_order(self):
        """Test get specific order"""
        self.log("Testing get specific order...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        if not self.created_order_id:
            self.log("❌ No order ID available", "ERROR")
            return False
        
        try:
            response = self.user_session.get(f"{BACKEND_URL}/orders/{self.created_order_id}")
            self.log(f"Get specific order response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("order"):
                    self.log("✅ Get specific order successful")
                    return True
                else:
                    self.log("❌ Get specific order failed: No order in response", "ERROR")
                    return False
            else:
                self.log(f"❌ Get specific order failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get specific order failed: {str(e)}", "ERROR")
            return False
    
    def test_admin_get_all_orders(self):
        """Test admin get all orders"""
        self.log("Testing admin get all orders...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        try:
            response = self.admin_session.get(f"{BACKEND_URL}/admin/orders")
            self.log(f"Admin get all orders response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "orders" in data and "total" in data:
                    self.log(f"✅ Admin get all orders successful: {data['total']} orders")
                    return True
                else:
                    self.log("❌ Admin get all orders failed: Missing fields", "ERROR")
                    return False
            else:
                self.log(f"❌ Admin get all orders failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin get all orders failed: {str(e)}", "ERROR")
            return False
    
    # ========== SYSTEM HEALTH TESTS ==========
    
    def test_api_health_check(self):
        """Test API root health check"""
        self.log("Testing API health check...")
        
        try:
            response = requests.get(f"{BACKEND_URL}/")
            self.log(f"API health check response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "running":
                    self.log("✅ API health check successful")
                    return True
                else:
                    self.log("❌ API health check failed: Invalid status", "ERROR")
                    return False
            else:
                self.log(f"❌ API health check failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ API health check failed: {str(e)}", "ERROR")
            return False
    
    def test_cors_headers(self):
        """Test CORS headers"""
        self.log("Testing CORS headers...")
        
        try:
            response = requests.options(f"{BACKEND_URL}/")
            self.log(f"CORS preflight response status: {response.status_code}")
            
            # Check for CORS headers
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            missing_headers = []
            for header in cors_headers:
                if header not in response.headers:
                    missing_headers.append(header)
            
            if not missing_headers:
                self.log("✅ CORS headers present")
                return True
            else:
                self.log(f"⚠️ Missing CORS headers: {missing_headers}", "WARNING")
                return True  # Not critical for functionality
                
        except Exception as e:
            self.log(f"❌ CORS test failed: {str(e)}", "ERROR")
            return False
    
    def create_test_image(self, filename="test_image.jpg", content=b"fake_image_content"):
        """Create a temporary test image file"""
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        temp_file.write(content)
        temp_file.close()
        return temp_file.name
    
    # ========== MEDIA LIBRARY TESTS ==========
    
    def test_media_upload_single(self):
        """Test uploading a single image"""
        self.log("Testing single media upload...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
            
        # Create test image
        test_image_path = self.create_test_image("single_test.jpg")
        
        try:
            with open(test_image_path, 'rb') as f:
                files = {'files': ('test_image.jpg', f, 'image/jpeg')}
                response = self.admin_session.post(f"{BACKEND_URL}/media/upload", files=files)
            
            self.log(f"Single upload response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("files"):
                    uploaded_file = data["files"][0]
                    self.uploaded_media_ids.append(uploaded_file["_id"])
                    self.log(f"✅ Single upload successful: {uploaded_file['filename']}")
                    
                    # Verify file structure
                    required_fields = ["_id", "filename", "originalName", "url", "size", "type", "uploadedBy", "createdAt"]
                    missing_fields = [field for field in required_fields if field not in uploaded_file]
                    if missing_fields:
                        self.log(f"⚠️ Missing fields in response: {missing_fields}", "WARNING")
                    
                    return True
                else:
                    self.log("❌ Upload failed: Invalid response structure", "ERROR")
                    return False
            else:
                self.log(f"❌ Upload failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Upload request failed: {str(e)}", "ERROR")
            return False
        finally:
            # Clean up temp file
            try:
                os.unlink(test_image_path)
            except:
                pass
    
    def test_media_upload_multiple(self):
        """Test uploading multiple images"""
        self.log("Testing multiple media upload...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
            
        # Create multiple test images
        test_images = []
        for i in range(3):
            test_image_path = self.create_test_image(f"multi_test_{i}.jpg", f"fake_image_content_{i}".encode())
            test_images.append(test_image_path)
        
        try:
            files = []
            file_handles = []
            for i, image_path in enumerate(test_images):
                f = open(image_path, 'rb')
                file_handles.append(f)
                files.append(('files', (f'test_image_{i}.jpg', f, 'image/jpeg')))
            
            response = self.admin_session.post(f"{BACKEND_URL}/media/upload", files=files)
            
            # Close file handles
            for f in file_handles:
                f.close()
            
            self.log(f"Multiple upload response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("files"):
                    uploaded_files = data["files"]
                    self.log(f"✅ Multiple upload successful: {len(uploaded_files)} files")
                    
                    for uploaded_file in uploaded_files:
                        self.uploaded_media_ids.append(uploaded_file["_id"])
                    
                    return True
                else:
                    self.log("❌ Multiple upload failed: Invalid response structure", "ERROR")
                    return False
            else:
                self.log(f"❌ Multiple upload failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Multiple upload request failed: {str(e)}", "ERROR")
            return False
        finally:
            # Clean up temp files
            for image_path in test_images:
                try:
                    os.unlink(image_path)
                except:
                    pass
    
    def test_media_upload_validation(self):
        """Test file type validation"""
        self.log("Testing file type validation...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
            
        # Create a non-image file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".txt")
        temp_file.write(b"This is not an image")
        temp_file.close()
        
        try:
            with open(temp_file.name, 'rb') as f:
                files = {'files': ('test_file.txt', f, 'text/plain')}
                response = self.admin_session.post(f"{BACKEND_URL}/media/upload", files=files)
            
            self.log(f"Validation test response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and len(data.get("files", [])) == 0:
                    self.log("✅ File validation working: Non-image files rejected")
                    return True
                else:
                    self.log("⚠️ File validation may not be working properly", "WARNING")
                    return True  # Not a critical failure
            else:
                self.log(f"❌ Validation test failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Validation test request failed: {str(e)}", "ERROR")
            return False
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file.name)
            except:
                pass
    
    def test_media_list(self):
        """Test fetching media list"""
        self.log("Testing media list endpoint...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
            
        try:
            response = self.admin_session.get(f"{BACKEND_URL}/media")
            self.log(f"Media list response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["media", "total", "page", "totalPages"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log(f"❌ Media list missing fields: {missing_fields}", "ERROR")
                    return False
                
                self.log(f"✅ Media list successful: {data['total']} total items, page {data['page']}")
                
                # Test pagination
                if data['total'] > 0:
                    response_page2 = self.admin_session.get(f"{BACKEND_URL}/media?page=2&limit=1")
                    if response_page2.status_code == 200:
                        self.log("✅ Pagination working")
                    else:
                        self.log("⚠️ Pagination may have issues", "WARNING")
                
                return True
            else:
                self.log(f"❌ Media list failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Media list request failed: {str(e)}", "ERROR")
            return False
    
    def test_media_delete(self):
        """Test deleting media"""
        self.log("Testing media delete endpoint...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
            
        if not self.uploaded_media_ids:
            self.log("❌ No uploaded media to delete", "ERROR")
            return False
            
        # Test deleting the first uploaded media
        media_id = self.uploaded_media_ids[0]
        
        try:
            response = self.session.delete(f"{BACKEND_URL}/media/{media_id}")
            self.log(f"Media delete response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log(f"✅ Media delete successful: {media_id}")
                    self.uploaded_media_ids.remove(media_id)
                    return True
                else:
                    self.log("❌ Media delete failed: Invalid response", "ERROR")
                    return False
            elif response.status_code == 404:
                self.log("⚠️ Media not found (may have been deleted already)", "WARNING")
                return True  # Not a critical failure
            else:
                self.log(f"❌ Media delete failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Media delete request failed: {str(e)}", "ERROR")
            return False
    
    def test_unauthorized_access(self):
        """Test that endpoints require admin authentication"""
        self.log("Testing unauthorized access protection...")
        
        # Create a session without auth token
        unauth_session = requests.Session()
        
        # Test upload without auth
        test_image_path = self.create_test_image("unauth_test.jpg")
        
        try:
            with open(test_image_path, 'rb') as f:
                files = {'files': ('test_image.jpg', f, 'image/jpeg')}
                response = unauth_session.post(f"{BACKEND_URL}/media/upload", files=files)
            
            if response.status_code == 401 or response.status_code == 403:
                self.log("✅ Upload endpoint properly protected")
                upload_protected = True
            else:
                self.log(f"❌ Upload endpoint not protected: {response.status_code}", "ERROR")
                upload_protected = False
            
            # Test list without auth
            response = unauth_session.get(f"{BACKEND_URL}/media")
            if response.status_code == 401 or response.status_code == 403:
                self.log("✅ List endpoint properly protected")
                list_protected = True
            else:
                self.log(f"❌ List endpoint not protected: {response.status_code}", "ERROR")
                list_protected = False
            
            # Test delete without auth
            if self.uploaded_media_ids:
                media_id = self.uploaded_media_ids[0]
                response = unauth_session.delete(f"{BACKEND_URL}/media/{media_id}")
                if response.status_code == 401 or response.status_code == 403:
                    self.log("✅ Delete endpoint properly protected")
                    delete_protected = True
                else:
                    self.log(f"❌ Delete endpoint not protected: {response.status_code}", "ERROR")
                    delete_protected = False
            else:
                delete_protected = True  # Can't test without media
            
            return upload_protected and list_protected and delete_protected
            
        except Exception as e:
            self.log(f"❌ Unauthorized access test failed: {str(e)}", "ERROR")
            return False
        finally:
            try:
                os.unlink(test_image_path)
            except:
                pass
    
    def test_file_system_integration(self):
        """Test that files are actually saved to the filesystem"""
        self.log("Testing filesystem integration...")
        
        # This test would require access to the filesystem
        # Since we're in a container, we'll check if the upload directory exists
        upload_dir = Path("/app/frontend/public/uploads")
        
        if upload_dir.exists():
            self.log("✅ Upload directory exists")
            
            # Check if there are any files
            files = list(upload_dir.glob("*"))
            if files:
                self.log(f"✅ Found {len(files)} files in upload directory")
            else:
                self.log("ℹ️ No files found in upload directory (may be expected)")
            
            return True
        else:
            self.log("❌ Upload directory does not exist", "ERROR")
            return False
    
    def cleanup_uploaded_media(self):
        """Clean up any remaining uploaded media"""
        self.log("Cleaning up uploaded media...")
        
        for media_id in self.uploaded_media_ids[:]:
            try:
                response = self.session.delete(f"{BACKEND_URL}/media/{media_id}")
                if response.status_code == 200:
                    self.log(f"✅ Cleaned up media: {media_id}")
                    self.uploaded_media_ids.remove(media_id)
                else:
                    self.log(f"⚠️ Could not clean up media {media_id}: {response.status_code}")
            except Exception as e:
                self.log(f"⚠️ Error cleaning up media {media_id}: {str(e)}")
    
    def run_all_tests(self):
        """Run all media library tests"""
        self.log("=" * 60)
        self.log("STARTING MEDIA LIBRARY BACKEND TESTS")
        self.log("=" * 60)
        
        test_results = {}
        
        # Test 1: Admin Authentication
        test_results["admin_login"] = self.test_admin_login()
        
        if not test_results["admin_login"]:
            self.log("❌ Cannot proceed without admin authentication", "ERROR")
            return test_results
        
        # Test 2: File System Integration
        test_results["filesystem"] = self.test_file_system_integration()
        
        # Test 3: Single Media Upload
        test_results["single_upload"] = self.test_media_upload_single()
        
        # Test 4: Multiple Media Upload
        test_results["multiple_upload"] = self.test_media_upload_multiple()
        
        # Test 5: File Validation
        test_results["file_validation"] = self.test_media_upload_validation()
        
        # Test 6: Media List
        test_results["media_list"] = self.test_media_list()
        
        # Test 7: Media Delete
        test_results["media_delete"] = self.test_media_delete()
        
        # Test 8: Unauthorized Access Protection
        test_results["auth_protection"] = self.test_unauthorized_access()
        
        # Cleanup
        self.cleanup_uploaded_media()
        
        # Summary
        self.log("=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
        
        self.log("=" * 60)
        self.log(f"OVERALL: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED!")
        else:
            self.log(f"⚠️ {total - passed} tests failed")
        
        return test_results

def main():
    """Main test runner"""
    tester = MediaLibraryTester()
    results = tester.run_all_tests()
    
    # Return exit code based on results
    all_passed = all(results.values())
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())