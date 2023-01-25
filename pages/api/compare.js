import * as cv from 'opencv4nodejs';
import {decode} from 'jpeg-js';
import {join} from 'path';
import {readFileSync} from 'fs';
import generatedImage from '../assets/generated_3.jpeg';
import tomGruber2 from '../assets/tom_gruber2.png';

export default async (req, res) => {
    if (req.method === 'POST') {
      // Decode the images from base64
      const image1 = cv.imdecode(Buffer.from(tomGruber2, 'base64'));
      const image2 = cv.imdecode(Buffer.from(generatedImage, 'base64'));
  
      // Extract features using OpenCV
      const descriptor1 = cv.xfeatures2d.SIFT.create().detectAndCompute(image1, null);
      const descriptor2 = cv.xfeatures2d.SIFT.create().detectAndCompute(image2, null);
  
      // Compare the feature vectors using Euclidean distance
      const distance = cv.norm(descriptor1.descriptors, descriptor2.descriptors, cv.NORM_L2);
      res.status(200).json({ distance });
    } else {
      res.status(405).end();
    }
  }