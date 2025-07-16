import { db } from "@/config/firebase"
import { FirebaseError } from "firebase/app"
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore"

type Adapter<T> = (data: any) => T

export class GenericService<T extends { id?: string}> {
    private collectionName: string
    private adapter: Adapter<T>

    constructor (collectionName: string, adapter: Adapter<T>) {
        this.collectionName = collectionName
        this.adapter = adapter
    }

    private applyAdapter(data: any): T {
        return this.adapter(data)
    }

    async getAll(): Promise<T[] | null> {
        try {
            const querySnapshot = await getDocs(collection(db, this.collectionName))
            return querySnapshot.docs.map(doc => (this.applyAdapter({ id: doc.id, ...doc.data()})))
        } catch (error) {
            if (error instanceof FirebaseError) {
                const { message, code } = error
                console.log(message, code);
            }
            return null
        }
    }

    async getById(id: string): Promise<T | null> {
        try {
            const docRef = doc(db, this.collectionName, id)
            const docSnap = await getDoc(docRef)
            return docSnap.exists() ? this.applyAdapter({ id: docSnap.id, ...docSnap.data() }) : null
        } catch (error) {
            if (error instanceof FirebaseError) {
                const { message, code } = error
                console.log(message, code);
            }
            return null
        }
    }

    async create (data: Omit<T, 'id'>): Promise<T | null> {
        try {
            const docRef = await addDoc(collection(db, this.collectionName), data)
            return this.applyAdapter({ id: docRef.id, ...data})
        } catch (error) {
            if (error instanceof FirebaseError) {
                const { message, code } = error
                console.log(message, code)
            }
            return null
        }
    }

    async update (id: string, data: T): Promise<boolean> {
        try {
            const docRef = doc(db, this.collectionName, id)
            await setDoc(docRef, data, { merge: true })
            return true
        } catch (error) {
            if (error instanceof FirebaseError) {
                const { message, code } = error
                console.log(message, code)
            }
            return false
        }
    }

    async delete (id: string): Promise<void> {
        try {
            const docRef = doc(db, this.collectionName, id)
            await deleteDoc(docRef)
        } catch (error) {
            if (error instanceof FirebaseError) {
                const { message, code } = error
                console.log(message, code)
            }
        }
    }
}