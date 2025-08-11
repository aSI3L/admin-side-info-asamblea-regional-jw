export function AdaptableLoadingSpinner() {
    return (
        <div className="flex justify-center items-center w-full h-full">
            <div className="w-[min(3rem,20%)] h-[min(3rem,20%)] min-w-4 min-h-4 rounded-full inline-block border-t-4 border-r-4 border-r-transparent animate-spin"></div>
        </div>
    )
}