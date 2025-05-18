# First, install cerberus if not installed: pip install cerberus
from cerberus import Validator


def normalize_lead(data):
    # Define standard field mappings
    field_mappings = {
        'full_name': ['user_name', 'name', 'lead_name'],
        'email': ['user_email', 'lead_email', 'email_address'],
        'phone': ['phone_number', 'contact_number', 'mobile', 'telephone', 'number'],
        'job_title': ['position', 'title', 'role', 'occupation'],
        'company_name': ['company', 'organization', 'business_name', 'employer'],
        'website_link': ['website', 'web_address', 'url', 'site'],
        'address': ['location', 'postal_address', 'mailing_address'],
        'industry': ['sector', 'business_type', 'field'],
        'company_size': ['size', 'employees', 'team_size'],
        'source': ['lead_source', 'origin', 'referral_source']
    }

    # Define schema for validation
    schema = {
        'full_name': {'type': 'string'},
        'email': {'type': 'string'},
        'phone': {'type': 'string'},
        'job_title': {'type': 'string'},
        'company_name': {'type': 'string'},
        'website_link': {'type': 'string'},
        'address': {'type': 'string'},
        'industry': {'type': 'string'},
        'company_size': {'type': 'string'},
        'source': {'type': 'string'}
    }

    # Normalize data by applying alias mappings
    normalized_data = {}
    for standard_field, aliases in field_mappings.items():
        # Check standard field name first
        if standard_field in data:
            normalized_data[standard_field] = data[standard_field]
        else:
            # Check aliases
            for alias in aliases:
                if alias in data:
                    normalized_data[standard_field] = data[alias]
                    break

    # Validate the normalized data
    v = Validator(schema, allow_unknown=True)
    if not v.validate(normalized_data):
        print(f"Validation errors: {v.errors}")

    return normalized_data
