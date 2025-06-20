import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/consts/imageFile.consts"
import { useState } from "react"
import { FieldValues, Path, UseFormClearErrors, UseFormSetError } from "react-hook-form"

export const useFormImageUpload = <T extends FieldValues> (
  setValue: (name: keyof T, value: string | File | undefined) => void,
  setError: UseFormSetError<T>,
  clearErrors: UseFormClearErrors<T>,
  fieldName: Path<T>,
  imageUrl: string | File | undefined
) => {
    const [image, setImage] = useState<Blob>()
    const [imagePreview, setImagePreview] = useState<string | File | undefined>(imageUrl)
    const [dragActive, setDragActive] = useState(false)

    const uploadToImgBB = async (imageName: string): Promise<string | null> => {
      const API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY

      if (!API_KEY) throw new Error("API Key de imgBB no configurada")
      if (!(image instanceof Blob)) throw new Error("Error: Blob.")
        
      const url = `https://api.imgbb.com/1/upload?key=${API_KEY}&name=asambleaRegional-${imageName}`
      const data = new FormData()
      data.append('image', image)

      try {
        const response = await fetch(url, {
          method: 'POST',
          body: data
        })

        const responseData = await response.json()

        return responseData.data.url
      } catch (error) {
        console.log(error);
        return null
      }
    }
    const handleChangeImage = (file: File | undefined) => {
      if (file) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          setError(fieldName, { type: "manual", message: "Formato de archivo inválido. Solo PNG, JPG, JPEG Y WEBP."})
          return
        }

        if (!(file.size <= MAX_FILE_SIZE)) {
          setError(fieldName, { type: "manual", message: "El archivo debe pesar menos de 5Mb."})
          return
        }
        setImage(file)
        setValue(fieldName, file)
        clearErrors(fieldName)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setValue(fieldName, undefined)
        setImagePreview(undefined)
      }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
              if(file.size <= MAX_FILE_SIZE) {
                handleChangeImage(file)
                clearErrors(fieldName)
              } else {
                setError(fieldName, { type: 'manual', message: "El archivo debe pesar menos de 5Mb."})
              }
            }
            else {
              setError(fieldName, { type: "manual", message: "Formato de archivo inválido. Solo PNG, JPG, JPEG Y WEBP."})
            }
        }
    }

    const removeImage = () => {
        handleChangeImage(undefined)
    }
    return { imagePreview, dragActive, handleDrag, handleDrop, removeImage, handleChangeImage, uploadToImgBB }
}