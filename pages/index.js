import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import buildspaceLogo from '../assets/buildspace-logo.png';

const Home = () => {
  const maxRetries = 20;
  const [input, setInput] = useState('');
  const [image, setImage] = useState();
  // Number of retries
  const [retry, setRetry] = useState(0);
  // Number of retries left
  const [retryCount, setRetryCount] = useState(maxRetries);
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState('');

  const generateAction = async () => {
    console.log('Generating...');
    // Add this check to make sure there is no double click
    if (isGenerating && retry === 0) return;

    // Set loading has started
    setIsGenerating(true);

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
    
    const finalInput = input.replace(/elliot/gi, 'epadf');

    // add the fetch request here
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: JSON.stringify({ finalInput }),
    });

    const data = await response.json();

    // If model is still loading
    if (response.status === 503) {
      console.log('Model is still loading. Please try again in a few seconds.');
      setRetry(data.estimated_time);
      return;
    }

    // If there is an error, log to console
    if (!response.ok) {
      console.log(`Error: ${data.error}`);
      // Stop loading
      setIsGenerating(false);
      return;
    }

    setFinalPrompt(input);
    setInput('');
    setImage(data.image);
    setIsGenerating(false);
  };

  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  useEffect(() => {
    const runRetry = async () => {
      if (retryCount === 0) {
        console.log(
          `Model still loading after ${maxRetries} retries. Please try again in a few seconds.`
        );
        setRetryCount(maxRetries);
        return;
      }
      console.log(`Trying again in ${retryCount} seconds`);

      await sleep(retry * 1000);

      await generateAction();
    };

    if (retry === 0) {
      return;
    }

    runRetry();
  }, [retry]);

  return (
    <div className='root'>
      <Head>
        <title>AI Avatar Generator | buildspace</title>
      </Head>
      <div className='container'>
        <div className='header'>
          <div className='header-title'>
            <h1>Elliotify that image!</h1>
          </div>
          <div className='header-subtitle'>
            <h2>
              Generate infinite images of Elliot. Use 'epadf' instead of Elliot
              in your prompts.
            </h2>
          </div>
          <div className='prompt-container'>
            <input
              type='text'
              className='prompt-box'
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className='prompt-buttons'>
              <a
                className={
                  isGenerating ? 'generate-button loading' : 'generate-button'
                }
                onClick={generateAction}
              >
                <div className='generate'>
                  {isGenerating ? (
                    <span className='loader'></span>
                  ) : (
                    <p>Generate</p>
                  )}
                </div>
              </a>
            </div>
          </div>
          {image && (
            <div className='output-content'>
              <Image src={image} width={512} height={512} alt={input} />
              <p>{finalPrompt}</p>
            </div>
          )}
        </div>
      </div>
      <div className='badge-container grow'>
        <a
          href='https://buildspace.so/builds/ai-avatar'
          target='_blank'
          rel='noreferrer'
        >
          <div className='badge'>
            <Image src={buildspaceLogo} alt='buildspace logo' />
            <p>build with buildspace</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Home;
