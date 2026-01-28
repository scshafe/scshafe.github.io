/**
 * Redux Hooks
 *
 * Typed hooks for use throughout the application.
 */

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use these hooks instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
