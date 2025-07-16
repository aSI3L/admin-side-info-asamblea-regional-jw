export function AdaptableLoadingSpinner() {
    return (
        <div className="flex justify-center items-center w-full h-full">
            <div className="min-w-2 min-h-2 max-w-12 max-h-12 rounded-full inline-block border-t-4 border-r-4 border-r-transparent animate-spin"></div>
        </div>
    )
}