import requests
import json
import os
import shutil
from zipfile import ZipFile
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_xray_token(client_id, client_secret):
    """
    Get authentication token from Xray
    """
    url = "https://xray.cloud.getxray.app/api/v2/authenticate"
    
    credentials = {
        "client_id": client_id,
        "client_secret": client_secret
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, headers=headers, json=credentials)
    print(f"Authentication Status Code: {response.status_code}")
    
    if response.status_code != 200:
        raise Exception(f"Authentication failed with status code: {response.status_code}\nResponse: {response.text}")
    
    return response.text.strip('"')

def create_report_zip(report_dir, zip_path):
    """
    Create a zip file containing the entire report directory
    """
    try:
        with ZipFile(zip_path, 'w') as zipf:
            # Walk through the directory
            for root, dirs, files in os.walk(report_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arc_name = os.path.relpath(file_path, report_dir)
                    zipf.write(file_path, arc_name)
        print(f"Successfully created zip file at {zip_path}")
        return True
    except Exception as e:
        print(f"Error creating zip file: {str(e)}")
        return False

def attach_report_to_jira(issue_key, zip_path, jira_email, jira_token):
    """
    Attach zipped report to Jira issue
    """
    base_url = "https://thanasornsawan1.atlassian.net/rest/api/3"
    auth = (jira_email, jira_token)
    
    try:
        with open(zip_path, 'rb') as file:
            files = {
                'file': (os.path.basename(zip_path), file, 'application/zip')
            }
            
            attach_url = f"{base_url}/issue/{issue_key}/attachments"
            headers = {
                "Accept": "application/json",
                "X-Atlassian-Token": "no-check"
            }
            
            response = requests.post(
                attach_url,
                headers=headers,
                files=files,
                auth=auth
            )
            
            if response.status_code == 200:
                print(f"Successfully attached report zip to {issue_key}")
                return True
            else:
                print(f"Failed to attach report zip: {response.text}")
                return False
                
    except Exception as e:
        print(f"Error attaching report zip: {str(e)}")
        return False

def transition_issue(issue_key, jira_email, jira_token, target_status):
    """
    Get available transitions and move issue to target status
    """
    base_url = "https://thanasornsawan1.atlassian.net/rest/api/3"
    auth = (jira_email, jira_token)
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    # First, get all available transitions
    transitions_url = f"{base_url}/issue/{issue_key}/transitions"
    transitions_response = requests.get(transitions_url, headers=headers, auth=auth)
    
    if transitions_response.status_code != 200:
        print(f"Error getting transitions: {transitions_response.text}")
        return False

    transitions = transitions_response.json()['transitions']
    
    # Find the transition ID for our target status
    transition_id = None
    for transition in transitions:
        if transition['to']['name'].lower() == target_status.lower():
            transition_id = transition['id']
            break

    if not transition_id:
        print(f"Could not find transition to status: {target_status}")
        return False

    # Perform the transition
    transition_payload = {
        "transition": {
            "id": transition_id
        }
    }
    
    response = requests.post(
        transitions_url,
        headers=headers,
        json=transition_payload,
        auth=auth
    )
    
    if response.status_code not in [200, 204]:
        print(f"Error transitioning issue: {response.text}")
        return False
        
    print(f"Successfully transitioned {issue_key} to {target_status}")
    return True

def update_issue_description(issue_key, jira_email, jira_token):
    """
    Update issue description with instructions for the zipped report
    """
    base_url = "https://thanasornsawan1.atlassian.net/rest/api/3"
    auth = (jira_email, jira_token)
    
    description = {
        "version": 1,
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "Automated test execution report from Cypress"
                    }
                ]
            },
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "To view the detailed HTML report:"
                    }
                ]
            },
            {
                "type": "bulletList",
                "content": [
                    {
                        "type": "listItem",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": "1. Download the attached zip file"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "listItem",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": "2. Extract the zip file"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "listItem",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": "3. Open index.html in your browser"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }

    try:
        update_url = f"{base_url}/issue/{issue_key}"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        payload = {
            "update": {},
            "fields": {
                "description": description
            }
        }
        
        response = requests.put(
            update_url,
            headers=headers,
            json=payload,
            auth=auth
        )
        
        if response.status_code == 204:
            print(f"Successfully updated description for {issue_key}")
            return True
        else:
            print(f"Failed to update description: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error updating description: {str(e)}")
        return False

def link_to_test_plan(issue_key, test_plan_key, jira_email, jira_token):
    """
    Set test plan as parent of the test execution
    """
    base_url = "https://thanasornsawan1.atlassian.net/rest/api/3"
    auth = (jira_email, jira_token)
    
    update_url = f"{base_url}/issue/{issue_key}"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    # Simple payload with parent field
    payload = {
        "fields": {
            "parent": {
                "key": test_plan_key
            }
        }
    }

    try:
        response = requests.put(
            update_url,
            headers=headers,
            json=payload,
            auth=auth
        )
        
        if response.status_code in [200, 204]:
            print(f"Successfully set {test_plan_key} as parent of {issue_key}")
            return True
        else:
            print(f"Failed to set parent: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error setting parent: {str(e)}")
        return False

def upload_test_results(xray_token, json_file_path, report_dir, jira_email, jira_token):
    try:
        with open(json_file_path, 'r') as file:
            test_results = json.load(file)
            print(f"Successfully loaded test results from {json_file_path}")
    except Exception as e:
        print(f"Error loading JSON file: {e}")
        raise

    # Get test plan key from test results
    test_plan_key = test_results.get('info', {}).get('testPlanKey')
    
    # Create temporary zip file
    zip_path = 'test_report.zip'
    if not create_report_zip(report_dir, zip_path):
        raise Exception("Failed to create report zip file")

    try:
        # Upload to Xray
        url = "https://xray.cloud.getxray.app/api/v1/import/execution"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {xray_token}"
        }
        
        print("Sending request to Xray...")
        response = requests.post(url, headers=headers, json=test_results)
        
        if response.status_code != 200:
            raise Exception(f"Upload failed with status code: {response.status_code}")
        
        result = response.json()
        new_execution_key = result.get('key')
        
        if new_execution_key:
            print(f"New test execution created: {new_execution_key}")
            
            # Link to test plan
            if test_plan_key:
                print(f"Linking test execution to test plan {test_plan_key}...")
                link_success = link_to_test_plan(new_execution_key, test_plan_key, jira_email, jira_token)
                if link_success:
                    print(f"Successfully linked {new_execution_key} to test plan {test_plan_key}")
                else:
                    print(f"Failed to link {new_execution_key} to test plan {test_plan_key}")
            
            # Attach zip report
            print("Attaching zipped report...")
            attach_success = attach_report_to_jira(new_execution_key, zip_path, jira_email, jira_token)
            
            # Update description
            if attach_success:
                print("Updating issue description...")
                update_issue_description(new_execution_key, jira_email, jira_token)
            
            # Handle status transition
            has_failures = any(test.get('status') != 'PASSED' for test in test_results.get('tests', []))
            target_status = "To Do" if has_failures else "Done"
            print(f"Moving {new_execution_key} to {target_status} based on test results...")
            
            transition_success = transition_issue(new_execution_key, jira_email, jira_token, target_status)
            if transition_success:
                print(f"Successfully moved {new_execution_key} to {target_status}")
            else:
                print(f"Failed to move {new_execution_key} to {target_status}")
        
        return result
    finally:
        # Clean up temporary zip file
        if os.path.exists(zip_path):
            os.remove(zip_path)
            print("Cleaned up temporary zip file")

if __name__ == "__main__":
    # Constants
    JSON_FILE_PATH = 'xray-results.json'
    REPORT_DIR = 'web/reports/mocha'  # Directory containing index.html and assets
    
    # Get credentials from environment variables
    XRAY_CLIENT_ID = os.getenv('XRAY_CLIENT_ID')
    XRAY_CLIENT_SECRET = os.getenv('XRAY_CLIENT_SECRET')
    JIRA_EMAIL = os.getenv('JIRA_EMAIL')
    JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN')
    
    # Validate required environment variables
    required_vars = ['XRAY_CLIENT_ID', 'XRAY_CLIENT_SECRET', 'JIRA_EMAIL', 'JIRA_API_TOKEN']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        raise Exception(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    try:
        print("Getting Xray token...")
        xray_token = get_xray_token(XRAY_CLIENT_ID, XRAY_CLIENT_SECRET)
        print("Successfully got Xray token")
        
        print("Uploading test results...")
        result = upload_test_results(xray_token, JSON_FILE_PATH, REPORT_DIR, JIRA_EMAIL, JIRA_API_TOKEN)
        
        print("Process completed!")
    except Exception as e:
        print(f"Error occurred: {str(e)}")