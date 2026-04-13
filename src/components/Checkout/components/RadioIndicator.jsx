const RadioIndicator = ({ selected }) => (
    <div className="flex items-center justify-center">
        <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${selected ? "primary_bg_color" : "bg-[#21212138]"
                }`}
        >
            <div className="w-2 h-2 bg-white rounded-full" />
        </div>
    </div>
);

export default RadioIndicator;
