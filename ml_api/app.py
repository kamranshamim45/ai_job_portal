from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json
import os

app = Flask(__name__)
CORS(app)

# Sample job data (in production, this would come from database)
sample_jobs = [
    {
        "id": "1",
        "title": "Software Engineer",
        "description": "Develop web applications using React, Node.js, and MongoDB",
        "skills_required": ["JavaScript", "React", "Node.js", "MongoDB", "Express"],
        "location": "Remote",
        "salary": 80000
    },
    {
        "id": "2",
        "title": "Data Scientist",
        "description": "Analyze data using Python, machine learning algorithms",
        "skills_required": ["Python", "Machine Learning", "Pandas", "Scikit-learn", "SQL"],
        "location": "New York",
        "salary": 95000
    },
    {
        "id": "3",
        "title": "Frontend Developer",
        "description": "Create responsive user interfaces with modern frameworks",
        "skills_required": ["JavaScript", "React", "CSS", "HTML", "TypeScript"],
        "location": "San Francisco",
        "salary": 85000
    },
    {
        "id": "4",
        "title": "Backend Developer",
        "description": "Build scalable APIs and microservices",
        "skills_required": ["Python", "Django", "PostgreSQL", "REST API", "Docker"],
        "location": "Remote",
        "salary": 90000
    },
    {
        "id": "5",
        "title": "Full Stack Developer",
        "description": "End-to-end development of web applications",
        "skills_required": ["JavaScript", "React", "Node.js", "Python", "AWS"],
        "location": "Austin",
        "salary": 95000
    },
    {
        "id": "6",
        "title": "AI/ML Engineer",
        "description": "Build and deploy machine learning models",
        "skills_required": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning"],
        "location": "Seattle",
        "salary": 120000
    },
    {
        "id": "7",
        "title": "DevOps Engineer",
        "description": "Manage cloud infrastructure and CI/CD pipelines",
        "skills_required": ["AWS", "Docker", "Kubernetes", "Jenkins", "Terraform"],
        "location": "Remote",
        "salary": 110000
    },
    {
        "id": "8",
        "title": "Mobile App Developer",
        "description": "Develop cross-platform mobile applications",
        "skills_required": ["React Native", "JavaScript", "iOS", "Android", "Firebase"],
        "location": "Los Angeles",
        "salary": 95000
    }
]

def preprocess_text(text):
    """Simple text preprocessing"""
    if isinstance(text, list):
        return ' '.join(text).lower()
    return str(text).lower()

def calculate_similarity(user_skills, job_skills):
    """Calculate similarity between user skills and job requirements"""
    # Combine all skills for vectorization
    all_skills = user_skills + job_skills

    # Create TF-IDF vectorizer
    vectorizer = TfidfVectorizer(stop_words='english')

    try:
        # Fit and transform
        tfidf_matrix = vectorizer.fit_transform(all_skills)

        # Calculate cosine similarity between user skills and job skills
        user_vector = tfidf_matrix[:len(user_skills)].mean(axis=0)
        job_vector = tfidf_matrix[len(user_skills):].mean(axis=0)

        similarity = cosine_similarity(user_vector, job_vector)[0][0]
        return float(similarity)
    except:
        # Fallback: simple Jaccard similarity
        user_set = set(skill.lower() for skill in user_skills)
        job_set = set(skill.lower() for skill in job_skills)
        intersection = len(user_set.intersection(job_set))
        union = len(user_set.union(job_set))
        return intersection / union if union > 0 else 0.0

@app.route('/api/recommend', methods=['POST'])
def recommend_jobs():
    try:
        data = request.get_json()

        if not data or 'skills' not in data:
            return jsonify({'error': 'Skills are required'}), 400

        user_skills = data['skills']
        if not isinstance(user_skills, list) or len(user_skills) == 0:
            return jsonify({'error': 'Skills must be a non-empty list'}), 400

        # Calculate similarity scores for all jobs
        recommendations = []
        for job in sample_jobs:
            similarity_score = calculate_similarity(user_skills, job['skills_required'])

            recommendations.append({
                'job_id': job['id'],
                'title': job['title'],
                'description': job['description'],
                'skills_required': job['skills_required'],
                'location': job['location'],
                'salary': job['salary'],
                'similarity_score': round(similarity_score * 100, 2)  # Convert to percentage
            })

        # Sort by similarity score (descending)
        recommendations.sort(key=lambda x: x['similarity_score'], reverse=True)

        # Return top 5 recommendations
        top_recommendations = recommendations[:5]

        return jsonify({
            'success': True,
            'recommendations': top_recommendations,
            'total_jobs': len(sample_jobs)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'ml_api'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
