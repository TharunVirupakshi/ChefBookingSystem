import React from 'react'
import { Sidebar} from "flowbite-react";
import { useNavigate } from 'react-router-dom';
import { HiArrowSmRight, HiChartPie, HiInbox, HiShoppingBag, HiTable, HiUser, HiViewBoards } from "react-icons/hi";

const SideNavbar = ({links}) => {
  const navigate = useNavigate()



  return (
    <Sidebar className='h-screen overflow-scroll rounded-lg shadow-md' aria-label="Sidebar with multi-level dropdown example">
  <Sidebar.Items>
        <Sidebar.ItemGroup>
          {links.map((link, index) =>
            link.type === "normal" ? (
              // Render normal links
              <Sidebar.Item
                key={index}
                // onClick={}
                href={link.path}
              >
                {link.title}
              </Sidebar.Item>
            ) : (
              // Render dropdown links
              <Sidebar.Collapse
                key={index}
                label={link.title}
              >
                {link.subLinks.map((subLink, subIndex) => (
                  <Sidebar.Item
                    key={subIndex}
                    onClick={() => navigate(subLink.path)}
                  >
                    {subLink.title}
                  </Sidebar.Item>
                ))}
              </Sidebar.Collapse>
            )
          )}
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>

  
  )
}

export default SideNavbar