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
