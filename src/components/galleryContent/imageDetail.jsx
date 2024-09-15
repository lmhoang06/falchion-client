"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  useCallback,
} from "react";
import { Dialog, Typography, Button } from "@material-tailwind/react";
import submitFrame from "@/libs/submit";
import { useGallery } from "@/contexts/galleryContext";
import { toast, Bounce } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

const boxStyle = (box) => ({
  left: `${(box.x - box.w / 2) * 100}%`,
  top: `${(box.y - box.h / 2) * 100}%`,
  width: `${box.w * 100}%`,
  height: `${box.h * 100}%`,
  borderColor: box.color,
});

const ImageWithBoundingBoxes = memo(
  ({ className, boxes = [], src, showObjects = true }) => {
    const imgRef = useRef(null);

    const scaledBoxes = useMemo(() => {
      const img = imgRef.current;
      if (!img || !img.complete) return [];

      return boxes.map((box) => ({
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        label: box.label,
        confidence: box.confidence,
        color: "green",
      }));
    }, [boxes]);

    return (
      <div className={className}>
        <div className="relative">
          <Image
            ref={imgRef}
            src={src}
            width="0"
            height="0"
            className="w-full h-full object-cover"
            alt="Bigger image"
          />
          {showObjects &&
            scaledBoxes.map((box, index) => (
              <div
                key={index}
                className="absolute border-2"
                style={boxStyle(box)}
              >
                <div className="absolute top-0 left-0 bg-green-500/50 text-white px-1 py-0.5 text-xs -translate-y-full">
                  {box.label} ({box.confidence.toFixed(2)})
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }
);

ImageWithBoundingBoxes.displayName = "ImageWithBoundingBoxes";

export default function ImageDetail({ imageData, open, handleOpen }) {
  const {
    video_name: videoName,
    frame_idx: frameName,
    similarity_score,
    src,
  } = imageData;
  const { sessionId } = useGallery();
  const [bbox, setBbox] = useState([]); //normalized bounding boxes with xywhn
  const [showObjects, setShowObjects] = useState(true);
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    const { video_name: videoName, frame_idx: frameName } = imageData;

    async function get_bbox() {
      try {
        const { status, data } = await axios.get(
          `/api/objects/info?videoName=${videoName}&frameName=${String(
            frameName
          ).padStart(3, "0")}`
        );

        if (status === 200 || status === 302) {
          setBbox(
            data.map(({ className, confidence, xywhn }) => {
              let [x, y, w, h] = xywhn.split(",").map((val) => Number(val));

              return {
                x: x,
                y: y,
                w: w,
                h: h,
                label: className,
                confidence: confidence,
              };
            })
          );
        }
      } catch (error) {
        console.error("Error fetching bounding box data:", error);
      }
    }

    async function getKeyframeIdx() {
      try {
        const { status, data } = await axios.get(
          `/api/keyframeIdx?videoName=${videoName}&frameName=${String(
            frameName
          ).padStart(3, "0")}`
        );

        if (status === 200 || status === 302) {
          setFrameIdx(data.frameIdx);
        }
      } catch (error) {
        console.error("Error fetching bounding box data:", error);
      }
    }

    get_bbox();
    getKeyframeIdx();
  }, [imageData]);

  const handleSubmit = useCallback(() => {
    const data = submitFrame(videoName, frameName, sessionId);
    const status = data?.submission;

    if (status === "true" || status === "TRUE") {
      toast.success("Accepted", {
        autoClose: 4500,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    }

    if (status === "WRONG") {
      toast.error("Wrong answer", {
        autoClose: 4500,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Bounce,
      });
    }
  }, [frameName, videoName, sessionId]);

  return (
    <Dialog
      open={open}
      size="xl"
      className="bg-gray-300 flex flex-row"
      handler={handleOpen}
      animate={{
        mount: { scale: 1, y: 0 },
        unmount: { scale: 1, y: 0 },
      }}
    >
      {/* <img className="w-1/2" src={src} alt={`${video_name}_${frame_idx}`} /> */}
      <ImageWithBoundingBoxes
        className="w-1/2"
        src={src}
        boxes={bbox}
        showObjects={showObjects}
      />
      <div className="w-1/2 flex-col p-3">
        <Typography variant="h4" color="blue">
          Video name: {videoName}
        </Typography>
        <Typography variant="h4" color="blue">
          Frame name: {frameName}
        </Typography>
        <Typography variant="h4" color="blue">
          Frame index: {frameIdx}
        </Typography>
        <Typography variant="h4" color="blue">
          Similarity score: {similarity_score}
        </Typography>
        {/* Function button */}
        <div className="flex gap-2">
          <Button
            color="blue"
            ripple
            variant="gradient"
            onClick={handleSubmit}
            size="sm"
          >
            Submit
          </Button>
          <Button
            color="blue"
            ripple
            variant="gradient"
            size="sm"
            onClick={() => setShowObjects(!showObjects)}
          >
            {showObjects ? "Hide objects" : "Show objects"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
