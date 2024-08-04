"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Home() {
  const router = useRouter();

  const [modelsData, setModelsData] = useState([]);
  const [showModelsData, setShowModelsData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParam, setSearchParam] = useState("");

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_URL}/model-spaces`
        );
        // console.log(res)
        if (res.status !== 200) {
          throw new Error("Error in network request");
        }
        console.log(res.data.data);
        setModelsData(res.data.data);
      } catch (err) {
        console.log("in catch bl");
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const handleClick = (id) => {
    console.log("id");
    console.log(id);
    router.push(`/model/${id}`);
  };

  useEffect(() => {
    console.log("searchParam");
    console.log(searchParam);
    if (searchParam !== "") {
      console.log("if");
      const filteredData = showModelsData.filter((model) =>
        model.name.toLowerCase().includes(searchParam.toLowerCase())
      );
      setShowModelsData(filteredData);
    } else {
      setShowModelsData(modelsData);
    }
  }, [searchParam, modelsData]);

  return (
    <div className="mx-auto mt-[5vh] w-[90%] md:w-[85%]">
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <h1 className="font-bold text-3xl">Model space</h1>
          <div>
            <input
              type="text"
              value={searchParam}
              onChange={(e) => setSearchParam(e.target.value)}
              placeholder="Search here.."
              className="border-2 py-[10px] px-[5px] mt-[20px] w-[40%]"
            />
          </div>
          <div className="flex flex-wrap mt-[5vh] justify-between">
            {showModelsData?.map((data) => {
              console.log(data);
              return (
                <div
                  key={data.id}
                  className="border-2 rounded-lg border-purple-400 py-[5px] px-[15px] bg-purple-400 my-[1%] w-[95%] md:w-[48%] lg:w-[32%] cursor-pointer"
                  onClick={() => handleClick(data.id)}
                >
                  <div className="flex items-center mt-[5%] ">
                    <div className="w-[30%] rounded-full overflow-hidden">
                      <img
                        src={data.avatar}
                        className="w-full h-full object-cover"
                        alt="image"
                      />
                    </div>
                    <div className="ml-[5%] text-white font-semibold text-lg">
                      {data.name}
                    </div>
                  </div>
                  <div className="mt-[30px] mb-[5%]">{data.description}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
