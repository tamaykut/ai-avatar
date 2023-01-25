from flask import Flask, request
from flask_cors import CORS
from PIL import Image
import torch
import torchvision.models as models
import json
from torchvision import transforms
import io
import base64
import logging
import numpy as np
from torchvision.transforms import ToPILImage
from flask import jsonify


app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})
# CORS(app, resources={r"*": {"origins": "*"}})


# Load VGG19 model
model = models.vgg19(pretrained=True)
model.eval()

# Define image preprocessing transforms
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


@app.route('/getFeatures', methods=['POST'])
def getFeatures():
   
    image_data = request.json['image']
    print("-------------------------------------------------------------")

    image_bytes = base64.b64decode(image_data)
    img = Image.open(io.BytesIO(image_bytes))
    img = transform(img).unsqueeze(0)

    # Get features
    features = model(img)
    feat = features.detach().numpy().reshape(40,25)
    img = Image.fromarray(np.uint8(feat*255), mode='L')
    img.save('feature.png')    
    img_file = io.BytesIO()
    img.save(img_file, format='PNG')
    img_file.seek(0)

    img_encoded = base64.b64encode(img_file.read()).decode('utf-8')
    return jsonify(img_encoded)

if __name__ == '__main__':
    app.run(debug=True)
