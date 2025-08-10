import React, { useEffect } from "react";
import { useState } from "react";
import axios from "axios";

function App() {
  const [jokes, setJokes] = useState([]);

  // useEffect(() => {
  //   axios.get("http://localhost:3000/api/jokes").then((res) => {
  //     setJokes(res.data);
  //   });
  // }, []);

  // see console on http://localhost:5173
  // you will see
  /*Access to XMLHttpRequest at 'http://localhost:3000/api/jokes' from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
   */

  // there are many ways to fix this cors  
  // 1st way === see server.js in backend for one of its way to handle cors and readme file for that explained in very detailed.

  useEffect(() => {
    axios.get("http://localhost:3000/api/jokes",{withCredentials : true}).then((res) => {
      setJokes(res.data);
    });
  }, []);

  // note : but when on production origin will be diffeernt port also  different so it will not work 
  // best in just devlopment phase and when origin is static


  // second way proxy config in vite.config.js  see vite.config.js
  // faking like origin of frontend is same as backend

  // useEffect(() => {
  //   axios.get("/api/jokes")
  //     .then((res) => setJokes(res.data))
  //     .catch((err) => console.error(err));
  // }, []);
  
 // third way is very good but if you are not changing origin so doest need but in large application or companies  we use that too 
 // dynamically  detect orgin and allow 
  
 const [isOpen , setIsOpen] = useState(null);

const handleClick = (id) => {
  if(isOpen == id){
    setIsOpen(null)
  }else{
    setIsOpen(id)
  }
}


  return (
    <div>
      <h1>Jokes  Total {jokes.length}</h1>
      <ul>
        {jokes.map((joke) => (
          <li id={`joke${joke.id}`} key={joke.id}>
          <p>{joke.joke}</p>
          <button onClick={()=>handleClick(joke.id)} style={{cursor : "pointer"}}>Show Punchline</button>
          {isOpen === joke.id && <p>{joke.punchline}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
