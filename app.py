from flask import Flask, request, jsonify, render_template
import os
import numpy as np
import pandas as pd
import boto3
import io
from keras.models import load_model
import librosa
from io import BytesIO
import warnings

app = Flask(__name__)

# Load the saved model
loaded_model = load_model("Emotion_speech.h5")
print("Loaded model from disk")

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

@app.route('/predict_emotion', methods=['POST'])
def predict_emotion():
    try:
        # Get the uploaded audio file from the request
        uploaded_file = request.files['audio']



        # Print a message to confirm that the audio file was received
        print("Received audio file:", uploaded_file.filename)

        # Create a Boto3 client for S3
        s3 = boto3.client("s3")

        # Save the uploaded audio file to S3
        bucket_name = "my-audio-bucket-1"  # Replace with your S3 bucket name
        s3.upload_fileobj(uploaded_file, bucket_name, uploaded_file.filename)

        # File URL in S3
        # Load the audio file directly into librosa from S3
        audio_object = s3.get_object(Bucket="my-audio-bucket-1", Key=uploaded_file.filename)
        

        audio_stream = audio_object["Body"].read()
        # Load the audio file using librosa

        temp_filename = 'temp_audio_file.wav'
        with open(temp_filename, 'wb') as temp_file:
            temp_file.write(audio_stream)


        with open(temp_filename, 'rb') as f:
            filename = f.read()
        print(list(filename[:100]))


        print("Loading audio file using librosa...")

        with warnings.catch_warnings(record=True) as w:
            try:
                X, sample_rate = librosa.load(temp_filename, res_type='kaiser_fast', duration=2.5, sr=22050*2, offset=0.5)
            except Exception as e:
                print("Error loading audio:", str(e))
                print("Error type:", type(e))
        
    for warning in w:
        print("Warning:", warning.message)

        print("X shape:", X.shape)
        print("Sample rate:", sample_rate)
        sample_rate = np.array(sample_rate)
        mfccs = np.mean(librosa.feature.mfcc(y=X, sr=sample_rate, n_mfcc=13), axis=0)
        feature_live = mfccs
        livedf2 = feature_live
        livedf2 = pd.DataFrame(data=livedf2)
        livedf2 = livedf2.stack().to_frame().T
        expected_shape = 216
        if livedf2.shape[1] < expected_shape:
            padding = np.zeros((livedf2.shape[0], expected_shape - livedf2.shape[1]))
            livedf2 = np.hstack((livedf2, padding))
        twodim = np.expand_dims(livedf2, axis=2)
        print("Loaded audio file using librosa...") 
        # Make predictions
        live_preds = loaded_model.predict(twodim, batch_size=32, verbose=1)
        live_preds1 = live_preds.argmax(axis=1)
        live_abc = live_preds1.astype(int).flatten()

        # Define the emotion mapping
        emotion_mapping = {
            0: "female_angry",
            1: "female_calm",
            2: "female_fearful",
            3: "female_happy",
            4: "female_sad",
            5: "male_angry",
            6: "male_calm",
            7: "male_fearful",
            8: "male_happy",
            9: "male_sad"
        }

        # Convert predictions to emotion labels using the provided mapping
        live_predictions = [emotion_mapping[prediction] for prediction in live_abc]

        os.remove(temp_filename)
        # Return the prediction result in JSON format
        return jsonify({
            'emotion': live_predictions[0]  # Assuming you're predicting a single emotion
        })
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

