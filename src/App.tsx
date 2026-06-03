import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Practice } from './pages/Practice';
import { Analysis } from './pages/Analysis';
import { History } from './pages/History';
import { Coach } from './pages/Coach';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/analysis/:sessionId" element={<Analysis />} />
          <Route path="/history" element={<History />} />
          <Route path="/coach" element={<Coach />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
