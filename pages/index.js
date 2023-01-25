import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import sureelLogo from '../assets/sureel-logo.png';
import axios from 'axios';
import { Radar } from 'react-chartjs-2'
import 'chart.js/auto';

const data = {
  labels: ['Artist 1', 'Artist 2', 'Artist 3', 'Artist 4', 'Artist 5'],
  datasets: [{
    label: 'Accreditation Score',
    data: [1, 2, 3, 4, 5],
    backgroundColor: 'rgba(255, 99, 132, 0.2)',
    borderColor: 'rgba(255, 99, 132, 1)',
    borderWidth: 1,
    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    gridLines: {
      color: "white",
      zeroLineColor: "white",
      lineWidth: 1
    },
    
  }]
};

const options = {
  scale: {
    angleLines: {
      color: "white",
      lineWidth: 1,
      display: true
    },
    pointLabels: {
      fontSize: 14,
    },
    gridLines: {
      color: "white",
      zeroLineColor: "white",
      lineWidth: 1
    },
    ticks: {
      beginAtZero: true,
      color: "white"
    }
  }
};



const Home = () => {
  // Max number of times we will retry for model loading (took my up to 5 mins)
  const maxRetries = 20;
  const [input, setInput] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [img, setImg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [retry, setRetry] = useState(0);
  const [retryCount, setRetryCount] = useState(maxRetries);

  const getFeatures = async () => {
    console.log('getFeatures')
    if (img === '') {
      console.log('no image')
      return;
    }
    try {
        const response = await axios.post('/api/getFeatures', { image: img });
        console.log('img ------------------------------------', img)
        console.log(response.data);
        document.getElementById("feature-img").src = 'data:image/png;base64,' + response.data;
    } catch (err) {
        console.error(err);
    }
  }

  const plotChart = async () => {
  
  }
  


  const generateAction = async () => {
    if (isGenerating && retry === 0) return;

    setIsGenerating(true);

    // If this is a retry request, take away retryCount
    if (retry > 0) {
      setRetryCount((prevState) => {
        if (prevState === 0) {
          return 0;
        } else {
          return prevState - 1;
        }
      });

      setRetry(0);
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: JSON.stringify({ input }),
    });

    // Everything should be returned in json
    const data = await response.json();

    // If model still loading, drop that retry time
    if (response.status === 503) {
      setRetry(data.estimated_time);
      return;
    }

    // If another error, drop error
    if (!response.ok) {
      console.log(`Error: ${data.error}`);
      setIsGenerating(false);
      return;
    }

    setFinalPrompt(input);
    setImg(data.image);
    setInput('');
    setIsGenerating(false);
  };

  // Helper to wait for number of seconds until we check model again
  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  const onChange = (event) => {
    setInput(event.target.value);
  };

  useEffect(() => {
    const runRetry = async () => {
      if (retryCount === 0) {
        console.log(
          `Model still loading after ${maxRetries} retries. Try request again in 5 minutes.`
        );
        setRetryCount(maxRetries);
        setIsGenerating(false);
        return;
      }

      console.log(`Trying again in ${retry} seconds.`);

      await sleep(retry * 1000);

      await generateAction();
    };

    if (retry === 0) {
      return;
    }

    runRetry();
  }, [retry]);

  return (
    <div className="root">
      <Head>
        <title>AI Avatar Generator | buildspace</title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>AI Avatar generator with Provenance</h1>
          </div>
          <div className="header-subtitle">
            <h2>
              Turn Tom Gruber into anybody or anything you want. Refer to him as tom_gruber.
            </h2>
          </div>
          <div className="prompt-container">
            <input className="prompt-box" value={input} onChange={onChange} />
            <div className="prompt-buttons">
              <a
                className={
                  isGenerating ? 'generate-button loading' : 'generate-button'
                }
                onClick={generateAction}
              >
                <div className="generate">
                  {isGenerating ? (
                    <span className="loader"></span>
                  ) : (
                    <p>Generate</p>
                  )}
                </div>
              </a>
            </div>
            <div className="prompt-buttons">
              <a
                className={
                  isGenerating ? 'generate-button loading' : 'generate-button'
                }
                onClick={getFeatures}
              >
                <div className="getFeatures">
                  {isGenerating ? (
                    <span className="loader"></span>
                  ) : (
                    <p>Features</p>
                  )}
                </div>
              </a>
            </div>
            <div className="prompt-buttons">
              <a
                className={
                  isGenerating ? 'generate-button loading' : 'generate-button'
                }
                onClick={plotChart}
              >
                <div className="plotCharts">
                  {isGenerating ? (
                    <span className="loader"></span>
                  ) : (
                    <p>Provenance</p>
                  )}
                </div>
              </a>
            </div>
          </div>
        </div>
        {img && (
          <div className="output-content">
            <Image src={img} width={512} height={512} alt={input} />
            <p>{finalPrompt}</p>
          </div>
        )}
      </div>
      <div className="flex p-5 mx-auto items-center justify-middle">
        <Image  width={256} height={256} id="feature-img" alt="feature image" />
      </div>
      <div className="flex p-5 mx-auto items-center justify-middle">
        <Radar
          data={data}
          options={options}
          width={400}
          height={400}
        />      
      </div>
      <div className="badge-container grow">
        <a
          href="https://buildspace.so/builds/ai-avatar"
          target="_blank"
          rel="noreferrer"
        >
          <div className="badge">
            <Image src={sureelLogo} alt="buildspace logo" />
            <p>Sureel Inc.</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Home;