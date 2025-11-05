#!/usr/bin/env python3
"""
Focused Render Deployment Login Test
Tests the specific issues mentioned in the review request
"""

import requests
import json
import time
from datetime import datetime

# Configuration for Render deployment
RENDER_URL = "https://enucuzakargo.onrender.com"
API_BASE = f"{RENDER_URL}/api"
ADMIN_EMAIL = "admin@enucuzakargo.com"
ADMIN_PASSWORD = "admin123"

class RenderLoginTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30
        
    def log(self, message, level="INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def test_api_health(self):
        """Test 1: API Health Check - GET /api/"""
        self.log("=" * 60)
        self.log("TEST 1: API Health Check")
        self.log("=" * 60)
        
        try:
            self.log(f"Making request to: {API_BASE}/")
            response = self.session.get(f"{API_BASE}/")
            
            self.log(f"Response Status: {response.status_code}")
            self.log(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log(f"Response Data: {json.dumps(data, indent=2)}")
                    
                    expected_message = "En Ucuza Kargo API"
                    expected_status = "running"
                    
                    if data.get("message") == expected_message and data.get("status") == expected_status:
                        self.log("✅ API Health Check PASSED")
                        return True
                    else:
                        self.log(f"❌ API Health Check FAILED - Unexpected response structure", "ERROR")
                        return False
                        
                except json.JSONDecodeError as e:
                    self.log(f"❌ API Health Check FAILED - Invalid JSON: {response.text}", "ERROR")
                    return False
            else:
                self.log(f"❌ API Health Check FAILED - Status: {response.status_code}", "ERROR")
                self.log(f"Response Text: {response.text}", "ERROR")
                return False
                
        except requests.exceptions.Timeout:
            self.log("❌ API Health Check FAILED - Request timeout (30s)", "ERROR")
            return False
        except requests.exceptions.ConnectionError as e:
            self.log(f"❌ API Health Check FAILED - Connection error: {str(e)}", "ERROR")
            return False
        except Exception as e:
            self.log(f"❌ API Health Check FAILED - Exception: {str(e)}", "ERROR")
            return False
    
    def test_admin_login(self):
        """Test 2: Admin Login - POST /api/auth/login"""
        self.log("=" * 60)
        self.log("TEST 2: Admin Login")
        self.log("=" * 60)
        
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        try:
            self.log(f"Making login request to: {API_BASE}/auth/login")
            self.log(f"Login data: {json.dumps(login_data, indent=2)}")
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            self.log(f"Response Status: {response.status_code}")
            self.log(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log(f"Response Data: {json.dumps(data, indent=2)}")
                    
                    if data.get("success") and data.get("token"):
                        self.log("✅ Admin Login PASSED")
                        self.log(f"Token received: {data['token'][:20]}...")
                        if data.get("user"):
                            user = data["user"]
                            self.log(f"User details: Email={user.get('email')}, Role={user.get('role')}")
                        return True, data["token"]
                    else:
                        self.log("❌ Admin Login FAILED - No token in response", "ERROR")
                        return False, None
                        
                except json.JSONDecodeError as e:
                    self.log(f"❌ Admin Login FAILED - Invalid JSON: {response.text}", "ERROR")
                    return False, None
            else:
                self.log(f"❌ Admin Login FAILED - Status: {response.status_code}", "ERROR")
                self.log(f"Response Text: {response.text}", "ERROR")
                return False, None
                
        except requests.exceptions.Timeout:
            self.log("❌ Admin Login FAILED - Request timeout", "ERROR")
            return False, None
        except Exception as e:
            self.log(f"❌ Admin Login FAILED - Exception: {str(e)}", "ERROR")
            return False, None
    
    def test_auth_me(self, token):
        """Test 3: Auth Me - GET /api/auth/me"""
        self.log("=" * 60)
        self.log("TEST 3: Auth Me Endpoint")
        self.log("=" * 60)
        
        if not token:
            self.log("❌ Auth Me test skipped - No token available", "ERROR")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {token}"}
            self.log(f"Making request to: {API_BASE}/auth/me")
            self.log(f"Headers: Authorization: Bearer {token[:20]}...")
            
            response = self.session.get(f"{API_BASE}/auth/me", headers=headers)
            
            self.log(f"Response Status: {response.status_code}")
            self.log(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log(f"Response Data: {json.dumps(data, indent=2)}")
                    
                    if data.get("success") and data.get("user"):
                        user = data["user"]
                        self.log("✅ Auth Me Endpoint PASSED")
                        self.log(f"Current user: {user.get('email')} (Role: {user.get('role')})")
                        return True
                    else:
                        self.log("❌ Auth Me Endpoint FAILED - Invalid response structure", "ERROR")
                        return False
                        
                except json.JSONDecodeError as e:
                    self.log(f"❌ Auth Me Endpoint FAILED - Invalid JSON: {response.text}", "ERROR")
                    return False
            else:
                self.log(f"❌ Auth Me Endpoint FAILED - Status: {response.status_code}", "ERROR")
                self.log(f"Response Text: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Auth Me Endpoint FAILED - Exception: {str(e)}", "ERROR")
            return False
    
    def test_user_registration(self):
        """Test 4: User Registration - POST /api/auth/register"""
        self.log("=" * 60)
        self.log("TEST 4: User Registration")
        self.log("=" * 60)
        
        # Use timestamp to ensure unique email
        timestamp = int(time.time())
        test_email = f"testuser{timestamp}@example.com"
        
        register_data = {
            "name": "Test User",
            "email": test_email,
            "password": "testpass123",
            "phone": "05551234567",
            "company": "Test Company",
            "taxId": "1234567890"
        }
        
        try:
            self.log(f"Making registration request to: {API_BASE}/auth/register")
            self.log(f"Registration data: {json.dumps(register_data, indent=2)}")
            
            response = self.session.post(f"{API_BASE}/auth/register", json=register_data)
            
            self.log(f"Response Status: {response.status_code}")
            self.log(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                    self.log(f"Response Data: {json.dumps(data, indent=2)}")
                    
                    if data.get("success"):
                        self.log("✅ User Registration PASSED")
                        return True
                    else:
                        self.log(f"❌ User Registration FAILED - {data.get('message', 'Unknown error')}", "ERROR")
                        return False
                        
                except json.JSONDecodeError as e:
                    self.log(f"❌ User Registration FAILED - Invalid JSON: {response.text}", "ERROR")
                    return False
            else:
                self.log(f"❌ User Registration FAILED - Status: {response.status_code}", "ERROR")
                self.log(f"Response Text: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ User Registration FAILED - Exception: {str(e)}", "ERROR")
            return False
    
    def test_database_connection(self, token):
        """Test 5: Database Connection via settings endpoint"""
        self.log("=" * 60)
        self.log("TEST 5: Database Connection")
        self.log("=" * 60)
        
        if not token:
            self.log("❌ Database test skipped - No token available", "ERROR")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {token}"}
            self.log(f"Making request to: {API_BASE}/settings")
            
            response = self.session.get(f"{API_BASE}/settings", headers=headers)
            
            self.log(f"Response Status: {response.status_code}")
            self.log(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log(f"Response Data: {json.dumps(data, indent=2)}")
                    self.log("✅ Database Connection PASSED")
                    return True
                        
                except json.JSONDecodeError as e:
                    self.log(f"❌ Database Connection FAILED - Invalid JSON: {response.text}", "ERROR")
                    return False
            else:
                self.log(f"❌ Database Connection FAILED - Status: {response.status_code}", "ERROR")
                self.log(f"Response Text: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Database Connection FAILED - Exception: {str(e)}", "ERROR")
            return False
    
    def test_cors_headers(self):
        """Test 6: CORS Headers"""
        self.log("=" * 60)
        self.log("TEST 6: CORS Headers")
        self.log("=" * 60)
        
        try:
            # Test preflight request
            headers = {
                'Origin': 'https://enucuzakargo.onrender.com',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
            
            self.log(f"Making OPTIONS request to: {API_BASE}/auth/login")
            self.log(f"Request headers: {json.dumps(headers, indent=2)}")
            
            response = self.session.options(f"{API_BASE}/auth/login", headers=headers)
            
            self.log(f"Response Status: {response.status_code}")
            self.log(f"Response Headers: {dict(response.headers)}")
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }
            
            self.log(f"CORS Headers found: {json.dumps(cors_headers, indent=2)}")
            
            if response.status_code in [200, 204] or cors_headers['Access-Control-Allow-Origin']:
                self.log("✅ CORS Headers PASSED")
                return True
            else:
                self.log("❌ CORS Headers FAILED - No proper CORS headers found", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ CORS Headers test failed: {str(e)}", "ERROR")
            return False
    
    def run_focused_tests(self):
        """Run focused tests for render deployment login issues"""
        self.log("🚀 STARTING FOCUSED RENDER DEPLOYMENT LOGIN TESTS")
        self.log(f"Target URL: {RENDER_URL}")
        self.log(f"API Base: {API_BASE}")
        
        results = {}
        admin_token = None
        
        # Test 1: API Health Check
        results["api_health"] = self.test_api_health()
        
        # Test 2: Admin Login (Critical)
        login_success, admin_token = self.test_admin_login()
        results["admin_login"] = login_success
        
        # Test 3: Auth Me (if login worked)
        if admin_token:
            results["auth_me"] = self.test_auth_me(admin_token)
        else:
            results["auth_me"] = False
        
        # Test 4: User Registration
        results["user_registration"] = self.test_user_registration()
        
        # Test 5: Database Connection (if we have token)
        if admin_token:
            results["database_connection"] = self.test_database_connection(admin_token)
        else:
            results["database_connection"] = False
        
        # Test 6: CORS Headers
        results["cors_headers"] = self.test_cors_headers()
        
        # Summary
        self.log("=" * 80)
        self.log("FOCUSED TEST RESULTS SUMMARY")
        self.log("=" * 80)
        
        passed = 0
        critical_tests = ["api_health", "admin_login"]
        critical_failures = []
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            priority = "🔴 CRITICAL" if test_name in critical_tests and not result else ""
            self.log(f"{test_name.replace('_', ' ').title()}: {status} {priority}")
            
            if result:
                passed += 1
            elif test_name in critical_tests:
                critical_failures.append(test_name)
        
        total = len(results)
        self.log("=" * 80)
        self.log(f"OVERALL: {passed}/{total} tests passed")
        
        if critical_failures:
            self.log(f"🔴 CRITICAL FAILURES: {', '.join(critical_failures)}")
            self.log("❌ LOGIN SYSTEM NOT WORKING")
        elif results.get("admin_login"):
            self.log("✅ ADMIN LOGIN IS WORKING")
        else:
            self.log("⚠️ MIXED RESULTS - CHECK INDIVIDUAL TEST DETAILS")
        
        self.log("=" * 80)
        
        return results

def main():
    """Main test runner"""
    tester = RenderLoginTester()
    results = tester.run_focused_tests()
    
    # Return exit code based on critical tests
    critical_passed = results.get("api_health", False) and results.get("admin_login", False)
    return 0 if critical_passed else 1

if __name__ == "__main__":
    exit(main())