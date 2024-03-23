import { useContext } from "react";
import AuthContext from "../../context/authProvider";
import { Link } from 'react-router-dom';
import {Map} from "./Map/Map";
import  useAuth  from "../../hooks/useAuth";
import { Button } from "antd";
import styles from './Home.module.css';
import { useJsApiLoader } from '@react-google-maps/api';
import MenuButton from "./ProfileORlogin/ProfileButton";
import LoginRegisterButton from "./ProfileORlogin/LoginRegisterButton";
import SearchInput from  "./Search/Search"
import CreateEventButton from './CreateEvent/CreateEventButton'
import EventFilter from "./Filter/Filter";
import MyEvents from './MyEvents/MyEvents'

const MAP_API_KEY =  process.env.REACT_APP_GOOGLE_MAPS_API_KEY

const defaultCenter = {
  lat: 49.8382600,
  lng: 24.0232400
};
const libraries = [ "places" ];
const Home = () => {
  const { auth, setAuth } = useAuth();
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: MAP_API_KEY,
    libraries
  })

  return (
    <div className={styles.Home}>
      {isLoaded ? (
        <>
          <Map center={defaultCenter} />
          {auth.token ? (
              <MenuButton />
          ) : <LoginRegisterButton />}
          <SearchInput />
          {/* <CreateEventButton /> */}
          <EventFilter />
          <MyEvents />
        </>
      ) : (
        <h1>Loading</h1>
      )}
    </div>
  );
}

export {Home};