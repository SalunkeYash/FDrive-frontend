import { AiFillFile, AiFillFileZip } from "react-icons/ai";
import { MdMovie, MdPictureAsPdf } from "react-icons/md";
import { IoMdHeadset } from "react-icons/io";
import {
  BiSolidImageAlt,
  BiSolidFileTxt,
  BiSolidFileDoc,
} from "react-icons/bi";
import type { FileIcons } from "@/types";

const fileIcons: FileIcons = {
  mp4: <MdMovie className="h-full w-full text-[#CA2E24]" />,
  mp3: <IoMdHeadset className="h-full w-full text-[#CA2E24]" />,
  pdf: <MdPictureAsPdf className="h-full w-full text-[#CA2E24]" />,
  jpg: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  jpeg: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  png: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  jfif: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  gif: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  webp: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  ico: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  svg: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  raw: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  cr2: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  cr3: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  nef: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  arw: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  dng: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  orf: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  rw2: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  raf: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  pef: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  srw: <BiSolidImageAlt className="h-full w-full text-[#CA2E24]" />,
  docx: <BiSolidFileDoc className="h-full w-full text-[#447DD7]" />,
  txt: <BiSolidFileTxt className="h-full w-full text-[#447DD7]" />,
  zip: <AiFillFileZip className="h-full w-full text-textC" />,
  any: <AiFillFile className="h-full w-full text-textC" />,
};

export default fileIcons;
