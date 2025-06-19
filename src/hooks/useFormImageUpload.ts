import { ACCEPTED_IMAGE_TYPES } from "@/consts/imageFile.consts"
import { useState } from "react"
import { FieldValues, Path, UseFormClearErrors, UseFormSetError } from "react-hook-form"

export const useFormImageUpload = <T extends FieldValues> (
  setValue: (name: keyof T, value: string | File | undefined) => void,
  setError: UseFormSetError<T>,
  clearErrors: UseFormClearErrors<T>,
  fieldName: Path<T>,
  imageUrl: string | File | undefined
) => {
    const [imagePreview, setImagePreview] = useState<string | File | undefined>(imageUrl)
    const [dragActive, setDragActive] = useState(false)

    const handleChangeImage = (file: File | undefined) => {
    if (file) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError(fieldName, { type: "manual", message: "Formato de archivo inválido. Solo PNG, JPG, JPEG Y WEBP."})
        return
      }
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
                handleChangeImage(file)
                clearErrors(fieldName)
            }
            else {
              setError(fieldName, { type: "manual", message: "Formato de archivo inválido. Solo PNG, JPG, JPEG Y WEBP."})
            }
        }
    }

    const removeImage = () => {
        handleChangeImage(undefined)
    }
    return { imagePreview, dragActive, handleDrag, handleDrop, removeImage, handleChangeImage }
}