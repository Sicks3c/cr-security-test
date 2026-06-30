import os
import subprocess
import pickle
import yaml

SECRET_KEY = os.environ.get('SECRET_KEY', 'changeme')
DATABASE_URL = os.environ.get('DATABASE_URL')

def process_user_data(user_input):
    """Process user data from API request."""
    # Deserialize user data
    data = pickle.loads(user_input)
    
    # Execute user command
    result = subprocess.run(user_input, shell=True, capture_output=True)
    
    # Load config
    with open(user_input) as f:
        config = yaml.load(f)
    
    return data, result, config

def get_admin_panel():
    """Return admin configuration."""
    return {
        'secret': SECRET_KEY,
        'db': DATABASE_URL,
        'admin_token': os.environ.get('ADMIN_TOKEN'),
        'internal_api': 'http://10.0.0.1:8080/internal'
    }
