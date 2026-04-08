#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Any

class DigitalProScanAPITester:
    def __init__(self, base_url="https://digital-proscan-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_resources = {
            'documents': [],
            'folders': [],
            'tags': []
        }

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            'name': name,
            'success': success,
            'details': details,
            'response_data': response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, f"Unsupported method: {method}", 0

            return response.status_code < 400, response.json() if response.content else {}, response.status_code
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
        except json.JSONDecodeError:
            return False, "Invalid JSON response", response.status_code if 'response' in locals() else 0

    def test_health_endpoints(self):
        """Test health and root endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        success, data, status = self.make_request('GET', '/')
        self.log_test("GET /api/ (root)", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test health endpoint
        success, data, status = self.make_request('GET', '/health')
        self.log_test("GET /api/health", success and status == 200, 
                     f"Status: {status}" if not success else "", data)

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        print("\n🔍 Testing Stats Endpoint...")
        
        success, data, status = self.make_request('GET', '/stats')
        expected_fields = ['total_documents', 'total_scans_today', 'total_pages', 'storage_used_mb', 'recent_activity']
        
        if success and status == 200:
            missing_fields = [field for field in expected_fields if field not in data]
            if not missing_fields:
                self.log_test("GET /api/stats (structure)", True, "", data)
            else:
                self.log_test("GET /api/stats (structure)", False, f"Missing fields: {missing_fields}", data)
        else:
            self.log_test("GET /api/stats", False, f"Status: {status}", data)

    def test_folders_crud(self):
        """Test folder CRUD operations"""
        print("\n🔍 Testing Folders CRUD...")
        
        # Test GET folders (empty)
        success, data, status = self.make_request('GET', '/folders')
        self.log_test("GET /api/folders (initial)", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test CREATE folder
        folder_data = {"name": "Test Folder", "color": "#FF5733"}
        success, data, status = self.make_request('POST', '/folders', folder_data)
        if success and status == 200:
            folder_id = data.get('id')
            if folder_id:
                self.created_resources['folders'].append(folder_id)
                self.log_test("POST /api/folders", True, "", data)
                
                # Test GET folders (with data)
                success, data, status = self.make_request('GET', '/folders')
                self.log_test("GET /api/folders (with data)", success and len(data) > 0, 
                             f"Found {len(data)} folders" if success else f"Status: {status}", data)
                
                # Test DELETE folder
                success, data, status = self.make_request('DELETE', f'/folders/{folder_id}')
                self.log_test("DELETE /api/folders/{id}", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                if success:
                    self.created_resources['folders'].remove(folder_id)
            else:
                self.log_test("POST /api/folders", False, "No ID in response", data)
        else:
            self.log_test("POST /api/folders", False, f"Status: {status}", data)

    def test_tags_crud(self):
        """Test tag CRUD operations"""
        print("\n🔍 Testing Tags CRUD...")
        
        # Test GET tags (empty)
        success, data, status = self.make_request('GET', '/tags')
        self.log_test("GET /api/tags (initial)", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test CREATE tag
        tag_data = {"name": "Test Tag", "color": "#33FF57"}
        success, data, status = self.make_request('POST', '/tags', tag_data)
        if success and status == 200:
            tag_id = data.get('id')
            if tag_id:
                self.created_resources['tags'].append(tag_id)
                self.log_test("POST /api/tags", True, "", data)
                
                # Test GET tags (with data)
                success, data, status = self.make_request('GET', '/tags')
                self.log_test("GET /api/tags (with data)", success and len(data) > 0, 
                             f"Found {len(data)} tags" if success else f"Status: {status}", data)
                
                # Test DELETE tag
                success, data, status = self.make_request('DELETE', f'/tags/{tag_id}')
                self.log_test("DELETE /api/tags/{id}", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                if success:
                    self.created_resources['tags'].remove(tag_id)
            else:
                self.log_test("POST /api/tags", False, "No ID in response", data)
        else:
            self.log_test("POST /api/tags", False, f"Status: {status}", data)

    def test_documents_crud(self):
        """Test document CRUD operations"""
        print("\n🔍 Testing Documents CRUD...")
        
        # Test GET documents (empty)
        success, data, status = self.make_request('GET', '/documents')
        self.log_test("GET /api/documents (initial)", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test CREATE document
        doc_data = {
            "name": "test-document.pdf",
            "file_type": "pdf",
            "size": 1024000,
            "page_count": 5,
            "tags": ["important"]
        }
        success, data, status = self.make_request('POST', '/documents', doc_data)
        if success and status == 200:
            doc_id = data.get('id')
            if doc_id:
                self.created_resources['documents'].append(doc_id)
                self.log_test("POST /api/documents", True, "", data)
                
                # Test GET single document
                success, data, status = self.make_request('GET', f'/documents/{doc_id}')
                self.log_test("GET /api/documents/{id}", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                
                # Test PATCH document (update)
                update_data = {"name": "updated-document.pdf", "is_starred": True}
                success, data, status = self.make_request('PATCH', f'/documents/{doc_id}', update_data)
                self.log_test("PATCH /api/documents/{id}", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                
                # Test GET documents with filters
                success, data, status = self.make_request('GET', '/documents', params={'starred': 'true'})
                self.log_test("GET /api/documents (starred filter)", success and status == 200, 
                             f"Found {len(data)} starred docs" if success else f"Status: {status}", data)
                
                success, data, status = self.make_request('GET', '/documents', params={'search': 'updated'})
                self.log_test("GET /api/documents (search filter)", success and status == 200, 
                             f"Found {len(data)} matching docs" if success else f"Status: {status}", data)
                
                # Test DELETE document
                success, data, status = self.make_request('DELETE', f'/documents/{doc_id}')
                self.log_test("DELETE /api/documents/{id}", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                if success:
                    self.created_resources['documents'].remove(doc_id)
            else:
                self.log_test("POST /api/documents", False, "No ID in response", data)
        else:
            self.log_test("POST /api/documents", False, f"Status: {status}", data)

    def test_ocr_endpoint(self):
        """Test OCR extraction (mocked)"""
        print("\n🔍 Testing OCR Endpoint...")
        
        # Create a document first
        doc_data = {
            "name": "ocr-test.pdf",
            "file_type": "pdf",
            "size": 512000,
            "page_count": 2
        }
        success, data, status = self.make_request('POST', '/documents', doc_data)
        if success and status == 200:
            doc_id = data.get('id')
            if doc_id:
                self.created_resources['documents'].append(doc_id)
                
                # Test OCR extraction
                success, data, status = self.make_request('POST', f'/ocr/{doc_id}')
                if success and status == 200 and 'ocr_text' in data:
                    self.log_test("POST /api/ocr/{doc_id} (mocked)", True, "", data)
                else:
                    self.log_test("POST /api/ocr/{doc_id} (mocked)", False, 
                                 f"Status: {status}, Missing ocr_text" if success else f"Status: {status}", data)
                
                # Cleanup
                self.make_request('DELETE', f'/documents/{doc_id}')
                self.created_resources['documents'].remove(doc_id)
            else:
                self.log_test("POST /api/ocr/{doc_id} (setup)", False, "Failed to create test document", data)
        else:
            self.log_test("POST /api/ocr/{doc_id} (setup)", False, f"Failed to create test document: {status}", data)

    def test_activities_endpoint(self):
        """Test activities endpoint"""
        print("\n🔍 Testing Activities Endpoint...")
        
        success, data, status = self.make_request('GET', '/activities')
        self.log_test("GET /api/activities", success and status == 200, 
                     f"Status: {status}" if not success else f"Found {len(data)} activities", data)

    def test_error_handling(self):
        """Test error handling"""
        print("\n🔍 Testing Error Handling...")
        
        # Test non-existent document
        success, data, status = self.make_request('GET', '/documents/non-existent-id')
        self.log_test("GET /api/documents/{invalid_id}", not success and status == 404, 
                     f"Expected 404, got {status}" if success or status != 404 else "", data)
        
        # Test invalid document creation
        invalid_doc = {"name": ""}  # Missing required fields
        success, data, status = self.make_request('POST', '/documents', invalid_doc)
        self.log_test("POST /api/documents (invalid data)", not success, 
                     f"Expected error, got {status}" if success else "", data)

    def cleanup_resources(self):
        """Clean up any remaining test resources"""
        print("\n🧹 Cleaning up test resources...")
        
        for doc_id in self.created_resources['documents']:
            self.make_request('DELETE', f'/documents/{doc_id}')
        
        for folder_id in self.created_resources['folders']:
            self.make_request('DELETE', f'/folders/{folder_id}')
        
        for tag_id in self.created_resources['tags']:
            self.make_request('DELETE', f'/tags/{tag_id}')

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Digital ProScan API Tests...")
        print(f"Testing against: {self.base_url}")
        
        try:
            self.test_health_endpoints()
            self.test_stats_endpoint()
            self.test_folders_crud()
            self.test_tags_crud()
            self.test_documents_crud()
            self.test_ocr_endpoint()
            self.test_activities_endpoint()
            self.test_error_handling()
        finally:
            self.cleanup_resources()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Return results for further processing
        return {
            'total_tests': self.tests_run,
            'passed_tests': self.tests_passed,
            'failed_tests': self.tests_run - self.tests_passed,
            'success_rate': self.tests_passed/self.tests_run*100 if self.tests_run > 0 else 0,
            'test_results': self.test_results
        }

def main():
    tester = DigitalProScanAPITester()
    results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    return 0 if results['failed_tests'] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())