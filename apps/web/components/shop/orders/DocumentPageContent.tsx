interface DocumentPageContentProps {
  compact?: boolean;
}

/** เนื้อหาหน้าเอกสารจำลอง (หัวเรื่อง + ตาราง + กราฟ + ย่อหน้า) ใช้ทั้งใน thumbnail และหน้าหลักของ viewer */
export default function DocumentPageContent({ compact = false }: DocumentPageContentProps) {
  return (
    <div className={`bg-white w-full h-full select-none ${compact ? "p-3" : "p-8"}`}>
      {/* Title */}
      <div className={`bg-gray-800 rounded-full ${compact ? "h-1.5 w-2/3 mb-1" : "h-4 w-2/3 mb-2"}`} />
      <div
        className={`bg-gray-300 rounded-full ${compact ? "h-1 w-1/2 mb-2" : "h-2.5 w-1/2 mb-6"}`}
      />

      {/* Table */}
      <div className={`border border-gray-200 rounded overflow-hidden ${compact ? "mb-2" : "mb-6"}`}>
        <div className="grid grid-cols-4 bg-gray-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`bg-gray-400 rounded-full ${compact ? "h-1 m-1" : "h-2 m-2"}`}
            />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, r) => (
          <div key={r} className="grid grid-cols-4 border-t border-gray-100">
            {Array.from({ length: 4 }).map((_, c) => (
              <div
                key={c}
                className={`bg-gray-200 rounded-full ${compact ? "h-1 m-1" : "h-1.5 m-2"}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className={`flex items-center ${compact ? "gap-2 mb-2" : "gap-6 mb-6"}`}>
        <div
          className={`rounded-full shrink-0 ${compact ? "w-6 h-6" : "w-24 h-24"}`}
          style={{
            background:
              "conic-gradient(#f97316 0turn 0.28turn, #6366f1 0.28turn 0.5turn, #10b981 0.5turn 0.72turn, #ec4899 0.72turn 1turn)",
          }}
        />
        <div className={`flex items-end flex-1 ${compact ? "gap-0.5 h-6" : "gap-1.5 h-20"}`}>
          {[40, 65, 30, 80, 55].map((h, i) => (
            <div key={i} className="flex-1 bg-sky-400 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Paragraph section */}
      <div
        className={`bg-gray-700 rounded-full ${compact ? "h-1 w-1/3 mb-1" : "h-2.5 w-1/3 mb-3"}`}
      />
      {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-200 rounded-full ${compact ? "h-1 mb-1" : "h-1.5 mb-2"} ${
            i === (compact ? 2 : 4) ? "w-3/5" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}
