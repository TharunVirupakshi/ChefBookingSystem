// import React, { useState } from "react";
// import { Sidebar } from "flowbite-react";

// import { useNavigate } from "react-router-dom";
// import { useEffect } from "react";
// import { initCollapses, initDropdowns, initFlowbite } from "flowbite";



// const SideNavbar = ({ links}) => {
//   const navigate = useNavigate();
//   const [activePath, setActivePath] = useState(""); // Track active path

//   const handleItemClick = (path) => {
//     setActivePath(path);
//     navigate(path);
//   };

//   useEffect(()=>{
//     initFlowbite()
//   },[])

//   return (
//     // <Sidebar aria-label="Sidebar with multi-level dropdown example" theme={customTheme}>
//     //   <Sidebar.Items>
//     //     <Sidebar.ItemGroup>
//     //       {links.map((link, index) =>
//     //         link.type === "normal" ? (
//     //           <Sidebar.Item
//     //             key={index}
//     //             href={link.path}
      
//     //             onClick={() => handleItemClick(link.path)}
//     //           >
//     //             {link.title}
//     //           </Sidebar.Item>
//     //         ) : (
//     //           <Sidebar.Collapse key={index} label={link.title}>
//     //             {link.subLinks.map((subLink, subIndex) => (
//     //               <Sidebar.Item
//     //                 key={subIndex}
                  
//     //                 onClick={() => handleItemClick(subLink.path)}
//     //               >
//     //                 {subLink.title}
//     //               </Sidebar.Item>
//     //             ))}
//     //           </Sidebar.Collapse>
//     //         )
//     //       )}
//     //     </Sidebar.ItemGroup>
//     //   </Sidebar.Items>
//     // </Sidebar>

// <div>

// <button data-drawer-target="sidebar-multi-level-sidebar" data-drawer-toggle="sidebar-multi-level-sidebar" aria-controls="sidebar-multi-level-sidebar" type="button" class="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
//    <span class="sr-only">Open sidebar</span>
//    <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
//    <path clip-rule="evenodd" fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
//    </svg>
// </button>

// <aside id="sidebar-multi-level-sidebar" class="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
//    <div class="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
  
//       <ul class="space-y-2 font-medium">
//       {links.map((link, index) =>
//          link.type === "normal" ? (
//          <li key={index}>
//             <a  onClick={() => handleItemClick(link.path)} href="#" class="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
//                <svg class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 21">
//                   <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/>
//                   <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/>
//                </svg>
//                <span  class="ms-3">{link.title}</span>
//             </a>
//          </li>
//          ) : ( 
//          <li key={index} >
//             <button type="button" class="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700" aria-controls="dropdown-example" data-collapse-toggle="dropdown-example">
//                   <svg class="flex-shrink-0 w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 21">
//                      <path d="M15 12a1 1 0 0 0 .962-.726l2-7A1 1 0 0 0 17 3H3.77L3.175.745A1 1 0 0 0 2.208 0H1a1 1 0 0 0 0 2h.438l.6 2.255v.019l2 7 .746 2.986A3 3 0 1 0 9 17a2.966 2.966 0 0 0-.184-1h2.368c-.118.32-.18.659-.184 1a3 3 0 1 0 3-3H6.78l-.5-2H15Z"/>
//                   </svg>
//                   <span class="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">{link.title}</span>
//                   <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
//                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
//                   </svg>
//             </button>
          
//             <ul id="dropdown-example" class="hidden py-2 space-y-2">
//             {link.subLinks?.map((subLink, subIndex) => (
//                   <li  key={subIndex}>
//                      <a   onClick={() => handleItemClick(subLink.path)} href="#" class="flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"> {subLink.title}</a>
//                   </li>
//                   ))} 
//             </ul>
//          </li>
//          )      
//          )}      
//       </ul>
//    </div>
// </aside>
// </div>
//   );
// };

// export default SideNavbar;



















import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { initFlowbite } from "flowbite";

const SideNavbar = ({ links }) => {
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState("");

  const handleItemClick = (path) => {
    setActivePath(path);
    if (path) navigate(path);
  };

  useEffect(() => {
    initFlowbite();
  }, []);

  return (
    <div>
      <button
        data-drawer-target="sidebar-multi-level-sidebar"
        data-drawer-toggle="sidebar-multi-level-sidebar"
        aria-controls="sidebar-multi-level-sidebar"
        type="button"
        className="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
      >
        <span className="sr-only">Open sidebar</span>
        <svg
          className="w-6 h-6"
          aria-hidden="true"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            fillRule="evenodd"
            d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
          ></path>
        </svg>
      </button>

      <aside
        id="sidebar-multi-level-sidebar"
        className="z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0"
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
          <ul className="space-y-2 font-medium">
            {links
              .filter((link) => link.type === "normal" || link.type === "dropdown") // Filter valid types
              .map((link, index) => (
                <li key={index}>
                  {link.type === "normal" && (
                    <button
                      onClick={() => handleItemClick(link.path)}
                      className={`flex items-center p-2 w-full text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        activePath === link.path ? "bg-gray-200" : ""
                      }`}
                    >
                      <span className="ms-3">{link.title}</span>
                    </button>
                  )}

                  {link.type === "dropdown" && (
                    <>
                      <button
                        type="button"
                        className="flex items-center w-full p-2 text-base text-gray-900 transition duration-75 rounded-lg group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                        aria-controls={`dropdown-${index}`}
                        data-collapse-toggle={`dropdown-${index}`}
                      >
                        <span className="flex-1 ms-3 text-left whitespace-nowrap">
                          {link.title}
                        </span>
                        <svg
                          className="w-3 h-3"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 10 6"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m1 1 4 4 4-4"
                          />
                        </svg>
                      </button>
                      <ul
                        id={`dropdown-${index}`}
                        className="hidden py-2 space-y-2"
                      >
                        {link.sublinks.map((sublink, subIndex) => (
                          <li key={subIndex}>
                            <button
                              onClick={() => handleItemClick(sublink.path)}
                              className={`flex items-center w-full p-2 text-gray-900 transition duration-75 rounded-lg pl-11 group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 ${
                                activePath === sublink.path ? "bg-gray-200" : ""
                              }`}
                            >
                              {sublink.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default SideNavbar;
