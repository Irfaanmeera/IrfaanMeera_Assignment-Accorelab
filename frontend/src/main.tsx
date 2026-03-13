import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store';
import { api } from './api/client';
import { axiosInterceptors } from './api/interceptors';
import './index.css';
import App from './App';

axiosInterceptors(api);

createRoot(document.getElementById('root')!).render(
 
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>

);

