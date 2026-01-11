"""
Scam Call Detection Module
Provides text-based scam detection using a pre-trained ML model
"""

import pickle
import string
import os
from pathlib import Path

# Get the directory where this module is located
MODULE_DIR = Path(__file__).parent


class ScamDetector:
    """
    A class to detect scam/fraud calls based on conversation text.
    Uses TF-IDF vectorization and a pre-trained classification model.
    """
    
    def __init__(self, model_path=None, vectorizer_path=None):
        """
        Initialize the ScamDetector with model and vectorizer.
        
        Args:
            model_path: Path to the model.pkl file (optional, defaults to module directory)
            vectorizer_path: Path to the vectorizer.pkl file (optional, defaults to module directory)
        """
        # Use default paths if not provided
        if model_path is None:
            model_path = MODULE_DIR / 'model.pkl'
        if vectorizer_path is None:
            vectorizer_path = MODULE_DIR / 'vectorizer.pkl'
            
        # Load the model and vectorizer
        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        with open(vectorizer_path, 'rb') as f:
            self.vectorizer = pickle.load(f)
    
    def preprocess_text(self, text: str) -> str:
        """
        Remove punctuation from text.
        
        Args:
            text: Raw input text
            
        Returns:
            Cleaned text without punctuation
        """
        return ''.join(char for char in text if char not in string.punctuation)
    
    def analyze(self, text: str) -> dict:
        """
        Analyze text for scam indicators.
        
        Args:
            text: The conversation/call transcript to analyze
            
        Returns:
            Dictionary with detection results:
            {
                'is_scam': bool,
                'confidence': float (0-1),
                'label': str ('SCAM' or 'SAFE'),
                'original_text': str,
                'processed_text': str
            }
        """
        # Preprocess the text
        processed_text = self.preprocess_text(text)
        
        # Vectorize the text
        vector = self.vectorizer.transform([processed_text])
        
        # Get prediction
        prediction = self.model.predict(vector)[0]
        
        # Try to get probability if model supports it
        try:
            probabilities = self.model.predict_proba(vector)[0]
            # probability of being a scam (class 0)
            confidence = probabilities[0] if prediction == 0 else probabilities[1]
        except AttributeError:
            # Model doesn't support predict_proba
            confidence = 1.0 if prediction == 0 else 0.0
        
        is_scam = bool(prediction == 0)
        
        return {
            'is_scam': is_scam,
            'confidence': float(confidence),
            'label': 'SCAM' if is_scam else 'SAFE',
            'original_text': text,
            'processed_text': processed_text,
            'risk_level': self._get_risk_level(float(confidence), is_scam)
        }
    
    def _get_risk_level(self, confidence: float, is_scam: bool) -> str:
        """Determine risk level based on confidence and prediction."""
        if not is_scam:
            return 'LOW'
        if confidence >= 0.8:
            return 'HIGH'
        elif confidence >= 0.6:
            return 'MEDIUM'
        else:
            return 'LOW'


# Convenience function for quick analysis
def detect_scam(text: str) -> dict:
    """
    Quick function to analyze text for scam indicators.
    Creates a new detector instance each time - use ScamDetector class for better performance.
    
    Args:
        text: The conversation/call transcript to analyze
        
    Returns:
        Detection results dictionary
    """
    detector = ScamDetector()
    return detector.analyze(text)


if __name__ == "__main__":
    # Test the detector
    detector = ScamDetector()
    
    test_cases = [
        "Hello, this is the IRS. You owe back taxes and must pay immediately or face arrest.",
        "Hi, this is John from your bank. We noticed suspicious activity on your account. Please verify your social security number.",
        "Hey, just calling to check in. How are you doing? Want to grab lunch tomorrow?",
        "Congratulations! You've won a free cruise! Just provide your credit card for the booking fee.",
    ]
    
    print("=" * 60)
    print("SCAM DETECTOR TEST")
    print("=" * 60)
    
    for text in test_cases:
        result = detector.analyze(text)
        print(f"\nText: {text[:50]}...")
        print(f"Result: {result['label']} (Risk: {result['risk_level']}, Confidence: {result['confidence']:.2%})")
    
    print("\n" + "=" * 60)

