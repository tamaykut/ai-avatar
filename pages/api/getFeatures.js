import axios from 'axios'
import FormData from 'form-data'

export default async (req, res) => {
    // Get image from request
    const { image } = req.body;

    try {

        const img = image.split(',')[1]
        const response = await axios.post('http://localhost:5000/getFeatures', {image: img}, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Send the response back to the client
        res.status(200).json(response.data)
    } catch (err) {
        console.error(err);
    }
}