import { Outlet } from 'react-router-dom';

export function ErrorLayout() {
  return (
    <div className="flex h-svh w-full flex-col items-center justify-center bg-bg-base p-6 text-center">
      <Outlet />
    </div>
  );
}
