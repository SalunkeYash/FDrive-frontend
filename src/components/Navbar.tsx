import { Link, useLocation } from "react-router-dom";
import { DiGoogleDrive } from "react-icons/di";
import { MdOutlinePeopleAlt, MdPeopleAlt, MdStarBorder } from "react-icons/md";
import { RiDeleteBin6Fill, RiDeleteBin6Line } from "react-icons/ri";
import { IoMdStar } from "react-icons/io";

function Navbar() {
  const { pathname } = useLocation();
  const isActive = (href: string) => pathname === href;

  return (
    <nav className="space-y-0.5 pr-5">
      <Link
        to="/drive/my-drive"
        className={`tablet:justify-normal tablet:space-x-3 tablet:px-4 tablet:py-1.5 flex items-center justify-center rounded-full p-2 hover:bg-darkC ${
          isActive("/drive/my-drive") ? "bg-[#C2E7FF]" : ""
        }`}
      >
        {isActive("/drive/my-drive") ? (
          <DiGoogleDrive className="tablet:h-5 tablet:w-5 h-6 w-6 rounded-sm border-[2.3px] border-textC bg-textC text-white" />
        ) : (
          <DiGoogleDrive className="tablet:h-5 tablet:w-5 h-6 w-6 rounded-sm border-[2.3px] border-textC" />
        )}
        <span className="tablet:block hidden">My Drive</span>
      </Link>
      <Link
        to="/drive/shared"
        className={`tablet:justify-normal tablet:space-x-3 tablet:px-4 tablet:py-1.5 flex items-center justify-center rounded-full p-2 hover:bg-darkC ${
          isActive("/drive/shared") ? "bg-[#C2E7FF]" : ""
        }`}
      >
        {isActive("/drive/shared") ? (
          <MdPeopleAlt className="tablet:h-5 tablet:w-5 h-6 w-6" />
        ) : (
          <MdOutlinePeopleAlt className="tablet:h-5 tablet:w-5 h-6 w-6" />
        )}
        <span className="tablet:block hidden">Shared with me</span>
      </Link>
      <Link
        to="/drive/starred"
        className={`tablet:justify-normal tablet:space-x-3 tablet:px-4 tablet:py-1.5 flex items-center justify-center rounded-full p-2 hover:bg-darkC ${
          isActive("/drive/starred") ? "bg-[#C2E7FF]" : ""
        }`}
      >
        {isActive("/drive/starred") ? (
          <IoMdStar className="tablet:h-5 tablet:w-5 h-6 w-6" />
        ) : (
          <MdStarBorder className="tablet:h-5 tablet:w-5 h-6 w-6" />
        )}
        <span className="tablet:block hidden">Starred</span>
      </Link>
      <Link
        to="/drive/trash"
        className={`tablet:justify-normal tablet:space-x-3 tablet:px-4 tablet:py-1.5 flex items-center justify-center rounded-full p-2 hover:bg-darkC ${
          isActive("/drive/trash") ? "bg-[#C2E7FF]" : ""
        }`}
      >
        {isActive("/drive/trash") ? (
          <RiDeleteBin6Fill className="tablet:h-5 tablet:w-5 h-6 w-6" />
        ) : (
          <RiDeleteBin6Line className="tablet:h-5 tablet:w-5 h-6 w-6" />
        )}
        <span className="tablet:block hidden">Bin</span>
      </Link>
    </nav>
  );
}

export default Navbar;
