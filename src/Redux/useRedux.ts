// External
import { useDispatch, TypedUseSelectorHook, useSelector } from "react-redux"

// Internal
import { AppDispatch, RootState } from "./store"

export const useAppDispatch: () => AppDispatch = useDispatch
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector