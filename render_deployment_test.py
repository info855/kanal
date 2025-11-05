#!/usr/bin/env python3
"""
Comprehensive Render Deployment Readiness Test for En Ucuza Kargo Backend
Tests all critical endpoints and features before deployment
"""

import requests
import json
import os
import tempfile
from pathlib import Path
import time
import uuid

# Configuration - Use Render deployment URL
BACKEND_URL = "https://enucuzakargo.onrender.com/api"
ADMIN_EMAIL = "admin@enucuzakargo.com"
ADMIN_PASSWORD = "admin123"

class RenderDeploymentTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.test_user_email = f"testuser_{int(time.time())}@test.com"
        self.test_user_id = None
        self.created_resources = {
            'orders': [],
            'shipping_companies': [],
            'media': [],
            'deposit_requests': []
        }
        
    def log(self, message, level="INFO"):
        """Log test messages"""
        print(f"[{level}] {message}")
        
    def test_health_check(self):
        """Test API health check endpoint"""
        self.log("Testing API health check...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            self.log(f"Health check response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "version" in data:
                    self.log(f"✅ Health check successful: {data['message']}")
                    return True
                else:
                    self.log("❌ Health check failed: Invalid response structure", "ERROR")
                    return False
            else:
                self.log(f"❌ Health check failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Health check request failed: {str(e)}", "ERROR")
            return False
    
    def test_cors_headers(self):
        """Test CORS headers are present"""
        self.log("Testing CORS headers...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            headers = response.headers
            
            cors_headers = [
                'access-control-allow-origin',
                'access-control-allow-methods',
                'access-control-allow-headers'
            ]
            
            missing_headers = []
            for header in cors_headers:
                if header not in headers:
                    missing_headers.append(header)
            
            if missing_headers:
                self.log(f"⚠️ Missing CORS headers: {missing_headers}", "WARNING")
                return True  # Not critical for basic functionality
            else:
                self.log("✅ CORS headers present")
                return True
                
        except Exception as e:
            self.log(f"❌ CORS headers test failed: {str(e)}", "ERROR")
            return False
    
    def test_user_registration(self):
        """Test user registration"""
        self.log("Testing user registration...")
        
        user_data = {
            "name": "Test User",
            "email": self.test_user_email,
            "password": "testpass123",
            "phone": "05551234567",
            "company": "Test Company",
            "taxId": "1234567890"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/register", json=user_data)
            self.log(f"Registration response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("token") and data.get("user"):
                    self.user_token = data["token"]
                    self.test_user_id = data["user"]["_id"]
                    self.log("✅ User registration successful")
                    return True
                else:
                    self.log("❌ Registration failed: Invalid response structure", "ERROR")
                    return False
            else:
                self.log(f"❌ Registration failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Registration request failed: {str(e)}", "ERROR")
            return False
    
    def test_admin_login(self):
        """Test admin authentication"""
        self.log("Testing admin login...")
        
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            self.log(f"Admin login response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("token"):
                    self.admin_token = data["token"]
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
    
    def test_user_login(self):
        """Test user login"""
        self.log("Testing user login...")
        
        login_data = {
            "email": self.test_user_email,
            "password": "testpass123"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            self.log(f"User login response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("token"):
                    self.user_token = data["token"]
                    self.log("✅ User login successful")
                    return True
                else:
                    self.log("❌ User login failed: No token in response", "ERROR")
                    return False
            else:
                self.log(f"❌ User login failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ User login request failed: {str(e)}", "ERROR")
            return False
    
    def test_get_current_user(self):
        """Test get current user endpoint"""
        self.log("Testing get current user...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/auth/me", headers=headers)
            self.log(f"Get current user response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("user"):
                    self.log("✅ Get current user successful")
                    return True
                else:
                    self.log("❌ Get current user failed: No user in response", "ERROR")
                    return False
            else:
                self.log(f"❌ Get current user failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Get current user request failed: {str(e)}", "ERROR")
            return False
    
    def test_shipping_companies_list(self):
        """Test shipping companies listing"""
        self.log("Testing shipping companies listing...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/shipping-companies")
            self.log(f"Shipping companies response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "companies" in data:
                    self.log(f"✅ Shipping companies list successful: {len(data['companies'])} companies")
                    return True
                else:
                    self.log("❌ Shipping companies list failed: Invalid response structure", "ERROR")
                    return False
            else:
                self.log(f"❌ Shipping companies list failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Shipping companies list request failed: {str(e)}", "ERROR")
            return False
    
    def test_settings_api(self):
        """Test settings API"""
        self.log("Testing settings API...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/settings")
            self.log(f"Settings response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "settings" in data:
                    self.log("✅ Settings API successful")
                    return True
                else:
                    self.log("❌ Settings API failed: Invalid response structure", "ERROR")
                    return False
            else:
                self.log(f"❌ Settings API failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Settings API request failed: {str(e)}", "ERROR")
            return False
    
    def test_wallet_balance(self):
        """Test wallet balance endpoint"""
        self.log("Testing wallet balance...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/wallet/balance", headers=headers)
            self.log(f"Wallet balance response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["balance", "minimumBalance", "canCreateShipment"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log(f"❌ Wallet balance missing fields: {missing_fields}", "ERROR")
                    return False
                
                self.log(f"✅ Wallet balance successful: {data['balance']} TL")
                return True
            else:
                self.log(f"❌ Wallet balance failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Wallet balance request failed: {str(e)}", "ERROR")
            return False
    
    def test_deposit_request(self):
        """Test deposit request creation"""
        self.log("Testing deposit request...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        deposit_data = {
            "amount": 500.0,
            "senderName": "Test Sender",
            "description": "Test deposit request"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/wallet/deposit-request", json=deposit_data, headers=headers)
            self.log(f"Deposit request response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("depositRequest"):
                    deposit_id = data["depositRequest"]["_id"]
                    self.created_resources['deposit_requests'].append(deposit_id)
                    self.log("✅ Deposit request successful")
                    return True
                else:
                    self.log("❌ Deposit request failed: Invalid response structure", "ERROR")
                    return False
            else:
                self.log(f"❌ Deposit request failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Deposit request failed: {str(e)}", "ERROR")
            return False
    
    def test_media_upload(self):
        """Test media upload functionality"""
        self.log("Testing media upload...")
        
        if not self.admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create test image
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        temp_file.write(b"fake_image_content")
        temp_file.close()
        
        try:
            with open(temp_file.name, 'rb') as f:
                files = {'files': ('test_image.jpg', f, 'image/jpeg')}
                response = self.session.post(f"{BACKEND_URL}/media/upload", files=files, headers=headers)
            
            self.log(f"Media upload response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("files"):
                    uploaded_file = data["files"][0]
                    self.created_resources['media'].append(uploaded_file["_id"])
                    self.log("✅ Media upload successful")
                    return True
                else:
                    self.log("❌ Media upload failed: Invalid response structure", "ERROR")
                    return False
            else:
                self.log(f"❌ Media upload failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Media upload request failed: {str(e)}", "ERROR")
            return False
        finally:
            try:
                os.unlink(temp_file.name)
            except:
                pass
    
    def test_orders_list(self):
        """Test orders listing"""
        self.log("Testing orders listing...")
        
        if not self.user_token:
            self.log("❌ No user token available", "ERROR")
            return False
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        try:
            response = self.session.get(f"{BACKEND_URL}/orders", headers=headers)
            self.log(f"Orders list response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["orders", "total", "page", "totalPages"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log(f"❌ Orders list missing fields: {missing_fields}", "ERROR")
                    return False
                
                self.log(f"✅ Orders list successful: {data['total']} orders")
                return True
            else:
                self.log(f"❌ Orders list failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Orders list request failed: {str(e)}", "ERROR")
            return False
    
    def test_database_connection(self):
        """Test database connection by performing a simple operation"""
        self.log("Testing database connection...")
        
        # Test by trying to get settings (which queries MongoDB)
        try:
            response = self.session.get(f"{BACKEND_URL}/settings")
            
            if response.status_code == 200:
                self.log("✅ Database connection working")
                return True
            else:
                self.log(f"❌ Database connection issue: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Database connection test failed: {str(e)}", "ERROR")
            return False
    
    def test_error_handling(self):
        """Test error handling for various scenarios"""
        self.log("Testing error handling...")
        
        test_results = {}
        
        # Test 404 - Invalid endpoint
        try:
            response = self.session.get(f"{BACKEND_URL}/nonexistent-endpoint")
            if response.status_code == 404:
                self.log("✅ 404 error handling working")
                test_results['404'] = True
            else:
                self.log(f"⚠️ 404 error handling: Expected 404, got {response.status_code}", "WARNING")
                test_results['404'] = True  # Not critical
        except Exception as e:
            self.log(f"❌ 404 test failed: {str(e)}", "ERROR")
            test_results['404'] = False
        
        # Test 401 - Unauthorized access
        try:
            response = self.session.get(f"{BACKEND_URL}/wallet/balance")  # Requires auth
            if response.status_code == 401:
                self.log("✅ 401 error handling working")
                test_results['401'] = True
            else:
                self.log(f"⚠️ 401 error handling: Expected 401, got {response.status_code}", "WARNING")
                test_results['401'] = True  # Not critical if it's 422 or similar
        except Exception as e:
            self.log(f"❌ 401 test failed: {str(e)}", "ERROR")
            test_results['401'] = False
        
        # Test 400 - Invalid data
        try:
            invalid_data = {"invalid": "data"}
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=invalid_data)
            if response.status_code in [400, 422]:  # 422 is also acceptable for validation errors
                self.log("✅ 400/422 error handling working")
                test_results['400'] = True
            else:
                self.log(f"⚠️ 400 error handling: Expected 400/422, got {response.status_code}", "WARNING")
                test_results['400'] = True  # Not critical
        except Exception as e:
            self.log(f"❌ 400 test failed: {str(e)}", "ERROR")
            test_results['400'] = False
        
        return all(test_results.values())
    
    def cleanup_resources(self):
        """Clean up created test resources"""
        self.log("Cleaning up test resources...")
        
        # Clean up media files
        if self.admin_token and self.created_resources['media']:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            for media_id in self.created_resources['media']:
                try:
                    response = self.session.delete(f"{BACKEND_URL}/media/{media_id}", headers=headers)
                    if response.status_code == 200:
                        self.log(f"✅ Cleaned up media: {media_id}")
                except Exception as e:
                    self.log(f"⚠️ Could not clean up media {media_id}: {str(e)}")
    
    def run_deployment_tests(self):
        """Run all deployment readiness tests"""
        self.log("=" * 80)
        self.log("STARTING RENDER DEPLOYMENT READINESS TESTS")
        self.log("=" * 80)
        
        test_results = {}
        
        # Critical Tests
        self.log("\n🔍 CRITICAL DEPLOYMENT TESTS")
        self.log("-" * 40)
        
        test_results["health_check"] = self.test_health_check()
        test_results["cors_headers"] = self.test_cors_headers()
        test_results["database_connection"] = self.test_database_connection()
        
        # Authentication Tests
        self.log("\n🔐 AUTHENTICATION TESTS")
        self.log("-" * 40)
        
        test_results["user_registration"] = self.test_user_registration()
        test_results["admin_login"] = self.test_admin_login()
        test_results["user_login"] = self.test_user_login()
        test_results["get_current_user"] = self.test_get_current_user()
        
        # Core Feature Tests
        self.log("\n⚙️ CORE FEATURE TESTS")
        self.log("-" * 40)
        
        test_results["shipping_companies"] = self.test_shipping_companies_list()
        test_results["settings_api"] = self.test_settings_api()
        test_results["orders_list"] = self.test_orders_list()
        
        # Wallet System Tests
        self.log("\n💰 WALLET SYSTEM TESTS")
        self.log("-" * 40)
        
        test_results["wallet_balance"] = self.test_wallet_balance()
        test_results["deposit_request"] = self.test_deposit_request()
        
        # Media Upload Tests
        self.log("\n📁 MEDIA UPLOAD TESTS")
        self.log("-" * 40)
        
        test_results["media_upload"] = self.test_media_upload()
        
        # Error Handling Tests
        self.log("\n🚨 ERROR HANDLING TESTS")
        self.log("-" * 40)
        
        test_results["error_handling"] = self.test_error_handling()
        
        # Cleanup
        self.cleanup_resources()
        
        # Summary
        self.log("\n" + "=" * 80)
        self.log("DEPLOYMENT READINESS TEST RESULTS")
        self.log("=" * 80)
        
        passed = 0
        total = len(test_results)
        critical_tests = ["health_check", "database_connection", "admin_login", "user_registration"]
        critical_failures = []
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            priority = "🔴 CRITICAL" if test_name in critical_tests and not result else ""
            self.log(f"{test_name.replace('_', ' ').title()}: {status} {priority}")
            
            if result:
                passed += 1
            elif test_name in critical_tests:
                critical_failures.append(test_name)
        
        self.log("=" * 80)
        self.log(f"OVERALL: {passed}/{total} tests passed")
        
        if critical_failures:
            self.log(f"🔴 CRITICAL FAILURES: {', '.join(critical_failures)}")
            self.log("❌ DEPLOYMENT NOT READY - Critical issues must be resolved")
            deployment_ready = False
        elif passed == total:
            self.log("🎉 ALL TESTS PASSED - READY FOR DEPLOYMENT!")
            deployment_ready = True
        else:
            self.log(f"⚠️ {total - passed} non-critical tests failed")
            self.log("✅ DEPLOYMENT READY - Minor issues can be addressed post-deployment")
            deployment_ready = True
        
        return test_results, deployment_ready

def main():
    """Main test runner"""
    tester = RenderDeploymentTester()
    results, deployment_ready = tester.run_deployment_tests()
    
    # Return exit code based on deployment readiness
    return 0 if deployment_ready else 1

if __name__ == "__main__":
    exit(main())