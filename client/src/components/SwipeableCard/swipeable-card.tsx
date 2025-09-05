import { useSwipeable } from "react-swipeable";
import { useState } from "react";
import type { Case } from "@shared/schema";
import { CaseCard } from "../case/case-card";

interface SwipeableCaseCardProps {
  caseItem: Case;
  onDelete: (id: string) => void;
  onAddDiaryEntry: (id: string) => void;
}

export function SwipeableCaseCard({ caseItem, onDelete, onAddDiaryEntry }: SwipeableCaseCardProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (data) => {
      if (data.dir === "Left" || data.dir === "Right") {
        setOffset(data.deltaX);
        setIsDragging(true);
      }
    },
    onSwiped: (data) => {
      setIsDragging(false);
      if (Math.abs(data.deltaX) > 200) { // Threshold for delete
        onDelete(caseItem.id);
      } else {
        setOffset(0);
      }
    },
    trackMouse: true,
    trackTouch: true,
  });

  return (
    <div className="relative overflow-hidden rounded-lg" {...handlers}>
      <div
        className="relative"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
      >
        {/* <CaseCard
          case={caseItem}
          onAddDiaryEntry={onAddDiaryEntry}
        /> */}
      </div>
      
      {/* Delete Background */}
      <div className="absolute inset-0 flex items-center justify-end px-4 bg-red-500">
        <i className="fas fa-trash-alt text-white text-xl" />
      </div>
    </div>
  );
}