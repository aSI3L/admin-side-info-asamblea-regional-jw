export function LoadingSpinner() {
    return (
        <div className="flex justify-center items-center w-screen h-screen">
            <div className="w-12 h-12 rounded-full inline-block border-t-4 border-r-4 border-r-transparent animate-spin"></div>
        </div>
    )
}