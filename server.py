from flask import Flask, request
from flask_cors import CORS
from PIL import Image
import torch
import torchvision.models as models
import json
from torchvision import transforms, datasets
import io
import base64
import logging
import numpy as np
from torchvision.transforms import ToPILImage
from flask import jsonify
from sklearn.metrics.pairwise import euclidean_distances, cosine_similarity
from scipy.spatial.distance import euclidean, cosine
import torch.nn as nn


app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})
# CORS(app, resources={r"*": {"origins": "*"}})

# Feature extractor
# Define image preprocessing transforms
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Load the image dataset
dataset = datasets.ImageFolder(root='tom', transform=transform)

# Create a data loader to iterate over the dataset
data_loader = torch.utils.data.DataLoader(dataset, batch_size=1, shuffle=False)

class VGG19FeatureExtractor(nn.Module):
    def __init__(self, original_model):
        super(VGG19FeatureExtractor, self).__init__()
        self.features = nn.Sequential(*list(original_model.features.children()))

    def forward(self, x):
        x = self.features(x)
        return x

# Initialize the VGG19 model
original_model = models.vgg19(pretrained=True)
model = VGG19FeatureExtractor(original_model)
model.eval()
    
# Iterate over the data and compute features
features = []
for images, labels in data_loader:
    # Pass the image through the VGG19 model
    with torch.no_grad():
        output = model(images)
    output = output.view(output.size(0), -1)
    # Append the output to the list of features
    features.append(output)

# feature_vector = np.array((255 * 100 * (features[index]/features[index].max()))).astype(np.uint8)
# reshaped_feature_vector = feature_vector.reshape(128, 196)


@app.route('/getFeatures', methods=['POST'])
def getFeatures():
   
    image_data = request.json['image']
    print("-------------------------------------------------------------")

    image_bytes = base64.b64decode(image_data)
    img = Image.open(io.BytesIO(image_bytes))
    img = transform(img).unsqueeze(0)
    
    with torch.no_grad():
        output = model(img)
    output = output.view(output.size(0), -1)

    # Euclidean distance calculation
    euclidean_dists = [euclidean(output.squeeze(), ref_feat.squeeze()) for ref_feat in features]

    # Cosine similarity calculation
    cosine_sims = [1 - cosine(output.squeeze(), ref_feat.squeeze()) for ref_feat in features]

    # Get features
    feature_vector = np.array((255 * 100 * (output/output.max()))).astype(np.uint8)
    reshaped_feature_vector = feature_vector.reshape(128, 196)
    
    img = Image.fromarray(np.uint8(255 * 100 * output/output.max()).reshape(128, 196), mode='L')
    # img.save('feature.png')    
    img_file = io.BytesIO()
    img.save(img_file, format='PNG')
    img_file.seek(0)

    img_encoded = base64.b64encode(img_file.read()).decode('utf-8')
    return jsonify({ "image": img_encoded, "euclidean_dists": euclidean_dists, "cosine_sims": cosine_sims })

if __name__ == '__main__':
    app.run(debug=True)
