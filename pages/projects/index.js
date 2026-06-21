import React, {useState, useEffect} from 'react'
import Projectdetails from '../../components/Projectdetails'
import { getSession } from 'next-auth/react'


function Projects() {
  const [searchterm, setSearchterm] = useState('')
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      // setSearchparam(router.query.searchtext)

      const response = await fetch(`/api/projects?str=${searchterm}`);
      const json = await response.json();
      setProjects(json);
    };
    fetchProjects();
  }, [searchterm]);

  console.log(projects);

  return (
    <>
    <div>    </div>
    {/* search form component */}

    <form className="py-5">
              <label
                htmlFor="search"
                className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-app-text"
              >
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="search"
                  id="search"
                  className="w-1/2 flex ml-auto p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-app-text dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Please search - input project name/s to search separated by ,"
                  required
                  onChange={e=> {setSearchterm(e.target.value); console.log(searchterm)}}
                />
                {/* <button
                  type="submit"
                  className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Search
                </button> */}
              </div>
            </form>

            {/* search form component end */}
    <div>
        {/* this is projects pages */}
        <Projectdetails projects={projects} />
    </div>
    
    </>
  )
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default Projects