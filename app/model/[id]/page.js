"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";

const ModelDetails = ({ params }) => {
  const modelId = params.id;

  const [modelsData, setModelsData] = useState([]);
  const [modelsInput, setModelsInput] = useState([]);
  const [modelsOutput, setModelsOutput] = useState([]);
  const [error, setError] = useState(null);
  const [inputErrors, setInputErrors] = useState(null);
  const [outputErrors, setOutputErrors] = useState(null);
  const [loading, setLoading] = useState(true);

  const [userInputs, setUserInputs] = useState({});
  const [userOutputData, setUserOutputData] = useState({});

  useEffect(() => {
    const fetchModels = async () => {
      try {
        // const res = await axios.get(
        //   `${process.env.NEXT_PUBLIC_URL}/model-spaces/${modelId}`
        // );
        const res = await axios.get(`/api/model-spaces/${modelId}`);
        // console.log(res)
        if (res.status !== 200) {
          throw new Error("Error in network request");
        }
        // console.log(res.data.data);
        setModelsData(res.data.data);
        setModelsInput(res.data.data.inputs);
        setModelsOutput(res.data.data.outputs);
      } catch (err) {
        // console.log("in catch bl");
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    const initialState = {};
    const errorState = {};
    modelsInput.forEach((input) => {
      initialState[input.name] = input.default;
      errorState[input.name] = false;
    });
    setUserInputs(initialState);
    setInputErrors(errorState);
  }, [modelsInput]);

  const handleInputChange = (e) => {
    const { name, type, files, value } = e.target;
    if (type === "file" && files[0]) {
      setUserInputs((prevState) => ({
        ...prevState,
        [name]: files[0],
      }));
    } else {
      setUserInputs((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
    setInputErrors((prev) => ({
      ...prev,
      [name]: false,
    }));
  };

  const handlePredict = async () => {
    // console.log("userInputs");
    // console.log(userInputs);

    const inputErrors = {};
    modelsInput.forEach((input) => {
      if (input.required && !userInputs[input.name]) {
        inputErrors[input.name] = "This is a required field";
      }
    });

    if (Object.keys(inputErrors).length > 0) {
      setInputErrors(inputErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `/api/model-spaces/${modelId}/predict`,
        userInputs
      );
      console.log(res);
      // if (res.status !== 200) {
      //   throw new Error("Error in network request");
      // }
      setUserOutputData(res?.data?.data);
      setOutputErrors(null);
    } catch (err) {
      // console.log("in catch block");
      // console.log(err.response.data);
      setOutputErrors(`Error: ${err.response?.data?.detail[0]?.msg}`);
    } finally {
      setLoading(false);
    }
  };

  // audio
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [uploadedAudioURL, setUploadedAudioURL] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleStartRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const url = URL.createObjectURL(audioBlob);
      setAudioURL(url);
      audioChunksRef.current = [];
    };

    mediaRecorderRef.current.start();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current.stop();

    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
    const url = URL.createObjectURL(audioBlob);
    setAudioURL(url);
    audioChunksRef.current = [];

    setUserInputs((prevState) => ({
      ...prevState,
      Audio: audioBlob,
    }));
    setInputErrors((prevErrors) => ({
      ...prevErrors,
      Audio: "",
    }));
  };

  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedAudioURL(url);
      setUserInputs((prevState) => ({
        ...prevState,
        Audio: file,
      }));
      setInputErrors((prevErrors) => ({
        ...prevErrors,
        Audio: "",
      }));
    } else {
      setInputErrors((prevErrors) => ({
        ...prevErrors,
        Audio: "This is a required field",
      }));
    }
  };

  return (
    <>
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="mx-auto mt-[5vh] w-[90%]">
          <h1 className="font-bold text-3xl cursor-pointer underline">
            <Link href="/">Model space</Link>
          </h1>
          <div className="border-2 bg-gray-100 mt-[20px] px-[20px] py-[30px] rounded-md">
            <div className="flex items-center">
              <div className="w-[80px] bg-red-400 rounded-full overflow-hidden">
                <img
                  src={modelsData.avatar}
                  className="w-full h-full object-cover"
                  alt="image"
                />
              </div>
              <div className="ml-[20px]  font-semibold text-lg">
                {modelsData.name}
              </div>
            </div>
            <div className="mt-[30px] text-sm">{modelsData.description}</div>
          </div>
          <div className="flex my-[5vh]  justify-between">
            <div className="w-[48%] bg-gray-100">
              <p className="mt-[10px] px-[10px] font-semibold text-lg underline text-center">
                Inputs
              </p>
              {modelsInput?.map((input) => {
                const { name, type, description } = input;
                return (
                  <div key={name} className="my-[20px] px-[10px]">
                    <div className="flex flex-col">
                      <p>
                        {name}{" "}
                        <span className="font-light text-gray-500 text-sm">
                          (type: {type[0].toUpperCase()}
                          {type.slice(1)})
                        </span>{" "}
                        {input.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </p>
                      {type !== "audio" && type !== "image" && (
                        <>
                          <input
                            name={name}
                            type={type}
                            value={userInputs[name]}
                            className="w-full px-[5px] py-[10px] border-2 rounded-sm mt-[10px]"
                            onChange={handleInputChange}
                          />
                          {inputErrors[name] && (
                            <p className="text-red-500 text-sm">
                              {inputErrors[name]}
                            </p>
                          )}
                        </>
                      )}

                      {type === "audio" && (
                        <div className="w-full px-[5px] py-[10px] border-2 rounded-sm mt-[10px] bg-white">
                          {!uploadedAudioURL && (
                            <button
                              className="bg-blue-500 text-white px-[15px] py-[5px] rounded-sm cursor-pointer mr-[10px] mb-[10px]"
                              onClick={
                                isRecording
                                  ? handleStopRecording
                                  : handleStartRecording
                              }
                            >
                              {isRecording
                                ? "Stop Recording"
                                : "Start Recording"}
                            </button>
                          )}
                          {!isRecording && !uploadedAudioURL && audioURL && (
                            <audio
                              className="mb-[10px]"
                              controls
                              src={audioURL}
                            />
                          )}
                          {!(uploadedAudioURL || audioURL) && <p>OR</p>}
                          {!audioURL && (
                            <>
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={handleAudioUpload}
                              />
                              {inputErrors[name] && (
                                <p className="text-red-500 text-sm">
                                  {inputErrors[name]}
                                </p>
                              )}
                            </>
                          )}
                          {!isRecording && !audioURL && uploadedAudioURL && (
                            <audio
                              className="mt-[10px]"
                              controls
                              src={uploadedAudioURL}
                            />
                          )}
                        </div>
                      )}

                      {type === "image" && (
                        <div className="w-full px-[5px] py-[10px] border-2 rounded-sm mt-[10px] bg-white">
                          <input
                            type="file"
                            accept="image/*"
                            name={name}
                            onChange={handleInputChange}
                          />
                          {inputErrors[name] && (
                            <p className="text-red-500 text-sm">
                              {inputErrors[name]}
                            </p>
                          )}
                          {userInputs[name] && (
                            <img
                              src={URL.createObjectURL(userInputs[name])}
                              alt="Preview"
                              className="mt-[10px] w-full h-auto"
                            />
                          )}
                        </div>
                      )}

                      <p className="font-light text-gray-500 text-sm mt-[5px]">
                        {description}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end">
                <button
                  className="bg-blue-500 text-white px-[15px] py-[5px] rounded-sm cursor-pointer mr-[10px] mb-[10px]"
                  onClick={handlePredict}
                >
                  Predict
                </button>
              </div>
            </div>
            <div className="w-[48%] bg-gray-100">
              <p className="mt-[10px] px-[10px] font-semibold text-lg underline text-center">
                Output
              </p>
              {modelsOutput?.map((output) => {
                const { name, type, description } = output;
                return (
                  <div key={name} className="my-[20px] px-[10px]">
                    <div className="flex flex-col">
                      <p>
                        {name}{" "}
                        <span className="font-light text-gray-500 text-sm">
                          (type: {type[0].toUpperCase()}
                          {type.slice(1)})
                        </span>{" "}
                      </p>
                      <p className="font-light text-gray-500 text-sm mt-[5px]">
                        {description}
                      </p>
                      {!outputErrors ? (
                        <p className="font-semibold border-2 px-[10px] py-[15px] mt-[15px]">
                          {userOutputData[name] ?? (
                            <span className="font-light text-gray-500 text-sm">
                              Output will be shown here once the prediction is
                              made
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="font-semibold border-2 px-[10px] py-[15px] mt-[15px]">
                          {userOutputData[name] ?? (
                            <span className="font-semibold text-red-500 text-sm">
                              {outputErrors ?? "Something went wrong!!"}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModelDetails;
