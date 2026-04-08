#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timezone
from typing import Dict, List, Any

class DigitalProScanAPITester:
    def __init__(self, base_url="https://digital-proscan-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_resources = {
            'team_members': [],
            'jobs': [],
            'geofences': [],
            'alerts': []
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
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params, timeout=10)
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
        """Test dashboard stats endpoint"""
        print("\n🔍 Testing Dashboard Stats...")
        
        success, data, status = self.make_request('GET', '/stats')
        expected_fields = ['total_team_members', 'working', 'support_activity', 'work_delay', 'traveling', 'idle', 'active_alerts']
        
        if success and status == 200:
            missing_fields = [field for field in expected_fields if field not in data]
            if not missing_fields:
                self.log_test("GET /api/stats (structure)", True, "", data)
            else:
                self.log_test("GET /api/stats (structure)", False, f"Missing fields: {missing_fields}", data)
        else:
            self.log_test("GET /api/stats", False, f"Status: {status}", data)

    def test_team_members_crud(self):
        """Test team members CRUD operations"""
        print("\n🔍 Testing Team Members CRUD...")
        
        # Test GET team members (empty)
        success, data, status = self.make_request('GET', '/team-members')
        self.log_test("GET /api/team-members (initial)", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test CREATE team member
        member_data = {
            "name": "Test Worker",
            "employee_id": "TEST001",
            "phone_number": "+1234567890",
            "email": "test@example.com"
        }
        success, data, status = self.make_request('POST', '/team-members', member_data)
        if success and status == 200:
            member_id = data.get('id')
            if member_id:
                self.created_resources['team_members'].append(member_id)
                self.log_test("POST /api/team-members", True, "", data)
                
                # Test GET specific team member
                success, data, status = self.make_request('GET', f'/team-members/{member_id}')
                self.log_test("GET /api/team-members/{id}", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                
                # Test PATCH team member (update)
                update_data = {"phone_number": "+1987654321"}
                success, data, status = self.make_request('PATCH', f'/team-members/{member_id}', update_data)
                self.log_test("PATCH /api/team-members/{id}", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                
                return member_id
            else:
                self.log_test("POST /api/team-members", False, "No ID in response", data)
        else:
            self.log_test("POST /api/team-members", False, f"Status: {status}", data)
        return None

    def test_jobs_crud(self):
        """Test jobs/work orders CRUD operations"""
        print("\n🔍 Testing Jobs/Work Orders CRUD...")
        
        # Test GET jobs (empty)
        success, data, status = self.make_request('GET', '/jobs')
        self.log_test("GET /api/jobs (initial)", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test CREATE job
        job_data = {
            "job_wo_number": "TEST-JOB-001",
            "description": "Test job for API testing",
            "location": "Test Site",
            "client_name": "Test Client"
        }
        success, data, status = self.make_request('POST', '/jobs', job_data)
        if success and status == 200:
            job_id = data.get('id')
            if job_id:
                self.created_resources['jobs'].append(job_id)
                self.log_test("POST /api/jobs", True, "", data)
                
                # Test GET specific job
                success, data, status = self.make_request('GET', f'/jobs/{job_id}')
                self.log_test("GET /api/jobs/{id}", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                
                # Test archive job
                success, data, status = self.make_request('PATCH', f'/jobs/{job_id}', params={'is_active': False})
                self.log_test("PATCH /api/jobs/{id} (archive)", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                
                # Test restore job
                success, data, status = self.make_request('PATCH', f'/jobs/{job_id}', params={'is_active': True})
                self.log_test("PATCH /api/jobs/{id} (restore)", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                
                return job_id
            else:
                self.log_test("POST /api/jobs", False, "No ID in response", data)
        else:
            self.log_test("POST /api/jobs", False, f"Status: {status}", data)
        return None

    def test_geofences_crud(self):
        """Test geofences CRUD operations"""
        print("\n🔍 Testing Geofences CRUD...")
        
        # Test GET geofences (empty)
        success, data, status = self.make_request('GET', '/geofences')
        self.log_test("GET /api/geofences (initial)", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test CREATE geofence
        geofence_data = {
            "name": "Test Geofence",
            "description": "Test geofence for API testing",
            "center_lat": 37.7749,
            "center_lng": -122.4194,
            "radius": 100,
            "color": "#002FA7"
        }
        success, data, status = self.make_request('POST', '/geofences', geofence_data)
        if success and status == 200:
            geofence_id = data.get('id')
            if geofence_id:
                self.created_resources['geofences'].append(geofence_id)
                self.log_test("POST /api/geofences", True, "", data)
                
                return geofence_id
            else:
                self.log_test("POST /api/geofences", False, "No ID in response", data)
        else:
            self.log_test("POST /api/geofences", False, f"Status: {status}", data)
        return None

    def test_location_tracking(self, member_id):
        """Test location tracking functionality"""
        print("\n🔍 Testing Location Tracking...")
        
        if not member_id:
            self.log_test("Location tracking test", False, "No member ID available")
            return
        
        # Test submit location
        location_data = {
            "user_id": member_id,
            "latitude": 37.7749,
            "longitude": -122.4194,
            "accuracy": 10.0,
            "speed": 5.0,
            "altitude": 100.0,
            "battery_level": 85
        }
        success, data, status = self.make_request('POST', '/locations', location_data)
        self.log_test("POST /api/locations", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test get locations
        success, data, status = self.make_request('GET', '/locations')
        self.log_test("GET /api/locations", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test get user locations
        success, data, status = self.make_request('GET', '/locations', params={'user_id': member_id})
        self.log_test("GET /api/locations (user filter)", success and status == 200, 
                     f"Status: {status}" if not success else "", data)

    def test_status_updates(self, member_id, job_id):
        """Test status update functionality"""
        print("\n🔍 Testing Status Updates...")
        
        if not member_id:
            self.log_test("Status updates test", False, "No member ID available")
            return
        
        # Test different status updates
        statuses = [
            {"status": "WORKING", "details": "Starting work"},
            {"status": "SUPPORT_ACTIVITY", "support_activity_type": "SAFETY_MEETING", "details": "Safety briefing"},
            {"status": "WORK_DELAY", "work_delay_type": "WAITING_PARTS", "details": "Waiting for materials"},
            {"status": "TRAVELING", "details": "Moving to next location"},
            {"status": "IDLE", "details": "Break time"}
        ]
        
        for status_data in statuses:
            status_data["user_id"] = member_id
            if job_id:
                status_data["job_wo_id"] = job_id
                status_data["job_wo_number"] = "TEST-JOB-001"
            status_data["latitude"] = 37.7749
            status_data["longitude"] = -122.4194
            
            success, data, status = self.make_request('POST', '/status', status_data)
            self.log_test(f"POST /api/status ({status_data['status']})", success and status == 200, 
                         f"Status: {status}" if not success else "", data)
        
        # Test get status updates
        success, data, status = self.make_request('GET', '/status')
        self.log_test("GET /api/status", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test get current statuses
        success, data, status = self.make_request('GET', '/status/current')
        self.log_test("GET /api/status/current", success and status == 200, 
                     f"Status: {status}" if not success else "", data)

    def test_sos_alerts(self, member_id):
        """Test SOS alert functionality"""
        print("\n🔍 Testing SOS Alerts...")
        
        if not member_id:
            self.log_test("SOS alerts test", False, "No member ID available")
            return
        
        # Test trigger SOS alert
        sos_data = {
            "user_id": member_id,
            "latitude": 37.7749,
            "longitude": -122.4194
        }
        success, data, status = self.make_request('POST', '/alerts/sos', sos_data)
        if success and status == 200:
            alert_id = data.get('id')
            if alert_id:
                self.created_resources['alerts'].append(alert_id)
                self.log_test("POST /api/alerts/sos", True, "", data)
                
                # Test get SOS alerts
                success, data, status = self.make_request('GET', '/alerts/sos')
                self.log_test("GET /api/alerts/sos", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                
                # Test acknowledge alert
                success, data, status = self.make_request('PUT', f'/alerts/sos/{alert_id}/acknowledge', 
                                                        params={'acknowledged_by': 'Test Admin'})
                self.log_test("PUT /api/alerts/sos/{id}/acknowledge", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                
                # Test resolve alert
                success, data, status = self.make_request('PUT', f'/alerts/sos/{alert_id}/resolve')
                self.log_test("PUT /api/alerts/sos/{id}/resolve", success and status == 200, 
                             f"Status: {status}" if not success else "", data)
                
                return alert_id
            else:
                self.log_test("POST /api/alerts/sos", False, "No ID in response", data)
        else:
            self.log_test("POST /api/alerts/sos", False, f"Status: {status}", data)
        return None

    def test_job_assignment(self, member_id, job_id):
        """Test job assignment to team members"""
        print("\n🔍 Testing Job Assignment...")
        
        if not member_id or not job_id:
            self.log_test("Job assignment test", False, "Missing member or job ID")
            return
        
        # Test assign job to member
        success, data, status = self.make_request('PUT', f'/team-members/{member_id}/job', 
                                                params={'job_wo_id': job_id, 'job_wo_number': 'TEST-JOB-001'})
        self.log_test("PUT /api/team-members/{id}/job", success and status == 200, 
                     f"Status: {status}" if not success else "", data)

    def test_reports(self):
        """Test reporting endpoints"""
        print("\n🔍 Testing Reports...")
        
        # Test productivity report
        success, data, status = self.make_request('GET', '/reports/productivity')
        self.log_test("GET /api/reports/productivity", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test work barriers report
        success, data, status = self.make_request('GET', '/reports/work-barriers')
        self.log_test("GET /api/reports/work-barriers", success and status == 200, 
                     f"Status: {status}" if not success else "", data)

    def test_reference_data(self):
        """Test reference data endpoints"""
        print("\n🔍 Testing Reference Data...")
        
        # Test support activity types
        success, data, status = self.make_request('GET', '/support-activities')
        self.log_test("GET /api/support-activities", success and status == 200, 
                     f"Status: {status}" if not success else "", data)
        
        # Test work delay types
        success, data, status = self.make_request('GET', '/work-delays')
        self.log_test("GET /api/work-delays", success and status == 200, 
                     f"Status: {status}" if not success else "", data)

    def test_error_handling(self):
        """Test error handling"""
        print("\n🔍 Testing Error Handling...")
        
        # Test non-existent team member
        success, data, status = self.make_request('GET', '/team-members/non-existent-id')
        self.log_test("GET /api/team-members/{invalid_id}", not success and status == 404, 
                     f"Expected 404, got {status}" if success or status != 404 else "", data)
        
        # Test invalid team member creation
        invalid_member = {"name": ""}  # Missing required fields
        success, data, status = self.make_request('POST', '/team-members', invalid_member)
        self.log_test("POST /api/team-members (invalid data)", not success, 
                     f"Expected error, got {status}" if success else "", data)

    def cleanup_resources(self):
        """Clean up any remaining test resources"""
        print("\n🧹 Cleaning up test resources...")
        
        # Delete geofences
        for geofence_id in self.created_resources['geofences']:
            self.make_request('DELETE', f'/geofences/{geofence_id}')
        
        # Delete team members (this should be last as other tests depend on it)
        for member_id in self.created_resources['team_members']:
            self.make_request('DELETE', f'/team-members/{member_id}')

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Digital ProScan Workforce Tracking API Tests...")
        print(f"Testing against: {self.base_url}")
        
        member_id = None
        job_id = None
        geofence_id = None
        
        try:
            self.test_health_endpoints()
            self.test_stats_endpoint()
            member_id = self.test_team_members_crud()
            job_id = self.test_jobs_crud()
            geofence_id = self.test_geofences_crud()
            self.test_location_tracking(member_id)
            self.test_status_updates(member_id, job_id)
            self.test_sos_alerts(member_id)
            self.test_job_assignment(member_id, job_id)
            self.test_reports()
            self.test_reference_data()
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