import Webcam from "react-webcam";
import "./App.css";
import OpenAI from "openai";
import Lottie from "react-lottie";
import analyze from "./assets/analyze.json";
import aiAnimate from "./assets/ai.json";
import AudioEQ from "./assets/audio.json";
import { useState } from "react";
import axios from "axios";

function App() {
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAIAPIKEY,
    dangerouslyAllowBrowser: true,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [limit, setLimit] = useState(0);
  const [imageSrc, setImageSrc] = useState("");
  const [dalleImage, setDalleImage] = useState("");

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  const AnalyzedefaultOptions = {
    loop: true,
    autoplay: true,
    animationData: analyze,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const AidefaultOptions = {
    loop: true,
    autoplay: true,
    animationData: aiAnimate,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const startStreaming = async (audiotext) => {
    const voiceId = process.env.REACT_APP_ELEVENVOICEID;
    const apiKey = process.env.REACT_APP_ELEVENAPIKEY;
    const baseUrl = process.env.REACT_APP_ELEVENURL;
    const headers = {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    };

    const voiceSettings = {
      stability: 0,
      similarity_boost: 0,
    };

    const requestBody = {
      text: audiotext,
      voice_settings: voiceSettings,
    };

    try {
      const response = await axios.post(`${baseUrl}/${voiceId}`, requestBody, {
        headers,
        responseType: "blob",
      });

      if (response.status === 200) {
        console.log(response.data);
        const audio = new Audio(URL.createObjectURL(response.data));
        setTimeout(() => audio.play(), 2000);
        setLoading(true);
      } else {
        alert("Error: Unable to stream audio.");
      }
    } catch (error) {
      alert("Error: Unable to stream audio. " + error.message);
    } finally {
      setLoading(true);
    }
  };

  const main = async () => {
    if (imageSrc !== "") {
      setLoading(!loading);
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Think as you are Sir Viktor E. Frankl. Narrate the picture of the human as if it is a nature documentary.Make it snarky and funny. Don't repeat yourself. Make it short. If I do anything remotely interesting, make a big deal about it!",
                },
                {
                  type: "image_url",
                  image_url: imageSrc,
                },
              ],
            },
          ],
          max_tokens: 200,
        });
        setMessage(response?.choices[0]?.message.content);

        const imageresponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: message,
          n: 1,
          size: "1024x1024",
        });

        setDalleImage(imageresponse.data[0].url);
        startStreaming(response.choices[0].message.content);
      } catch (err) {
        alert("Error Status " + err.status);
        setLoading(true);
      }
    } else {
      alert("Image not found");
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h2
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
          }}
        >
          DescribeYou
          <Lottie
            options={AidefaultOptions}
            height={50}
            width={50}
            speed={1}
            style={{ borderRadius: "50%" }}
          />
        </h2>
      </header>
      <div className="webcam">
        <p>
          Hmm.. Let AI👀 describe you in it's words. Take your picture in a well
          lit area💡
        </p>
        <Webcam
          style={{ borderRadius: "2rem" }}
          audio={false}
          height={"70%"}
          screenshotFormat="image/jpeg"
          width={"80%"}
          videoConstraints={videoConstraints}
          mirrored={true}
        >
          {({ getScreenshot }) =>
            loading ? (
              <button
                onClick={() => {
                  if (getScreenshot() !== "") {
                    setImageSrc(getScreenshot());
                    if (limit !== 3) {
                      setLimit(limit + 1);
                      main();
                      setMessage(" ");
                      setDalleImage(" ");
                    } else {
                      alert("Sorry! Only two requests per day");
                    }
                  } else {
                    alert("Image can't be captured");
                  }
                }}
              >
                Capture
              </button>
            ) : (
              <div>
                <Lottie
                  options={AnalyzedefaultOptions}
                  height={150}
                  width={150}
                  speed={1}
                  style={{ borderRadius: "50%" }}
                />
                <p>Let me analyze your image🔍</p>
              </div>
            )
          }
        </Webcam>
      </div>

      {!loading ? (
        <p></p>
      ) : (
        <section className="analysisContainer">
          <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: AudioEQ,
              rendererSettings: {
                preserveAspectRatio: "xMidYMid slice",
              },
            }}
            height={100}
            width={150}
            speed={1}
          />
          <p className="description">{message}</p>
          <img src={dalleImage} alt="" srcset="" />
        </section>
      )}
    </div>
  );
}

export default App;
