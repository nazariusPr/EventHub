import { useState, useEffect, useRef } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import usePlacesAutocomplete, { getGeocode } from "use-places-autocomplete";
import {
  Input,
  Select,
  DatePicker,
  Checkbox,
  AutoComplete,
  message,
} from "antd";
import CloseWindowButton from "../../../components/Buttons/CloseWindowButton/CloseWindowButton";
import CancelButton from "../../../components/Buttons/CancelButton/CancelButton";
import ApplyChangesButton from "../../../components/Buttons/ApplyChangesButton/ApplyChangesButton";
import {
  CameraOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { sendDataWithoutPhotos } from "../../../api/updateUserInfo";
import { deleteUserPhotos } from "../../../api/updateUserInfo";
import { sendPhotosToServer } from "../../../api/updateUserInfo";
import { getUserInfo } from "../../../api/getUserInfo";
import dayjs from "dayjs";
import styles from "./EditUserProfile.module.css";

const PlacesAutocomplete = ({ onSelectLocation, initialValue, cancelChanges }) => {
  const {
    ready,
    value,
    suggestions: { data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {},
    debounce: 300,
  });
  
  const handleInput = (value) => {
    setValue(value);
  };

  useEffect(() => {
    handleInput(initialValue);
  }, [cancelChanges]);

  const handleSelect = (value) => {
    setValue(value);
    clearSuggestions();
    getGeocode({ address: value }).then((results) => {
      const selectedPlace = results[0];
      const country = selectedPlace.address_components.find((component) =>
        component.types.includes("country")
      ).long_name;
      const region = selectedPlace.address_components.find(
        (component) =>
          component.types.includes("administrative_area_level_1") ||
          component.types.includes("administrative_area_level_2")
      ).long_name;
      const city = selectedPlace.address_components.find(
        (component) =>
          component.types.includes("locality") ||
          component.types.includes("sublocality") ||
          component.types.includes("postal_town")
      ).long_name;

      onSelectLocation(`${city}, ${region}, ${country}`);
    }).catch((error) => {
      message.info("Select another location");
      handleInput(initialValue);
    });;
  };

  const options = data.map((suggestion) => ({
    value: suggestion.description,
    label: (
      <div>
        <strong className={styles.MainSuggestion}>
          {suggestion.structured_formatting.main_text}
        </strong>
        <small className={styles.SecondarySuggestion}>
          {suggestion.structured_formatting.secondary_text}
        </small>
      </div>
    ),
  }));

  return (
    <AutoComplete
      options={options}
      onSelect={handleSelect}
      onSearch={handleInput}
      onChange={(newValue) => {
        handleInput(newValue);
        onSelectLocation(newValue);
      }}
      value={value}
      disabled={!ready}
      placeholder="Where do you live?"
      className={styles.Select}
      defaultActiveFirstOption={false}
    />
  );
};

const EditUserProfile = () => {
  const { TextArea } = Input;
  const { Option } = Select;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitChanges, setSubmitChanges] = useState(false);

  const [user, setUser] = useState(null);
  const [cancelAddress, setCancelAddress] = useState(false);

  const [userExistingPhotos, setUserExistingPhotos] = useState(null);
  const [photos, setPhotos] = useState(new Array(4).fill(null));
  const [uploadedPhotos, setUploadedPhotos] = useState(new Array(4).fill(null));
  const [toDeletePhotos, setToDeletePhotos] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  const fetchUser = async () => {
    try {
      const response = await getUserInfo();

      setUser({
        first_name: response.first_name,
        last_name: response.last_name,
        username: response.username,
        email: response.email,
        description: response.description,
        city: response.city,
        birth_date: response.birth_date && dayjs(response.birth_date),
        gender: response.gender,
        show_email: response.show_email,
      });

      const userPhotos = response.photo_responses.filter(
        (photo) => photo.photo_name !== "userDefaultImage"
      );
      setUserExistingPhotos(userPhotos);
      setPhotos(
        userPhotos
          .map((photo) => photo.photo_url)
          .concat(new Array(4 - userPhotos.length).fill(null))
      );
      setPhotoIndex(userPhotos.length);

      setLoading(true);
    } catch (error) {
      navigate("/login");
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    photos[photoIndex] = URL.createObjectURL(file);

    const newFormData = new FormData();
    newFormData.append("files", file);
    uploadedPhotos[photoIndex] = newFormData;

    setPhotos(photos);
    setUploadedPhotos(uploadedPhotos);
    setPhotoIndex(photoIndex + 1);
  };

  const handlePhotoDelete = (index) => {
    for (let photo of userExistingPhotos) {
      if (photo.photo_url === photos[index]) {
        setToDeletePhotos([...toDeletePhotos, photo.id]);
      }
    }
    photos.splice(index, 1);
    uploadedPhotos.splice(index, 1);

    photos.push(null);
    uploadedPhotos.push(null);

    setPhotoIndex(photoIndex - 1);
    setPhotos(photos);
    setUploadedPhotos(uploadedPhotos);
  };

  const updateUserInfo = (event) => {
    const { name, value } = event.target;
    setUser({
      ...user,
      [name]: value,
    });
  };

  const handleCityUpdate = (value) => {
    setUser({
      ...user,
      city: value,
    });
  };
 
  const applyChanges = async (event) => {
    event.preventDefault();

    try {
      setSubmitChanges(true);
      await sendDataWithoutPhotos({
        ...user,
        birth_date: user.birth_date.add(1, "day"),
      });
      await deleteUserPhotos(toDeletePhotos);
      await sendPhotosToServer(uploadedPhotos);

      handleClose();
      message.success("Successfully updated");
    } catch (error) {
      message.error(error.response.data);
    } finally {
      setSubmitChanges(false);
    }
  };

  const handleCancel = async (event) => {
    event.preventDefault();
    await fetchUser();
    setCancelAddress(!cancelAddress);
    setUploadedPhotos(new Array(4).fill(null));
    setToDeletePhotos([]);
  };

  const handleClose = () => {
    navigate("/");
  };
  return (
    <div className={styles.OuterContainer}>
      {!loading ? (
        <LoadingOutlined
          style={{ color: "white", fontSize: "72px", fontWeight: "1000" }}
        />
      ) : (
        <>
          {submitChanges && (
            <div className={styles.SubmitChanges}>
              <LoadingOutlined
                style={{ color: "white", fontSize: "72px", fontWeight: "1000" }}
              />
            </div>
          )}
          <form className={styles.InnerContainer}>
            <div className={styles.Header}>
              <p className={styles.Heading}>Edit account information</p>
              <CloseWindowButton onClick={handleClose} />
            </div>
            <div className={styles.Main}>
              <div className={styles.Photos}>
                {photos.map((photo, index) =>
                  index === photoIndex ? (
                    <div className={styles.Photo} key={index}>
                      <label className={styles.AddPhotoLabel}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => handlePhotoUpload(event)}
                          style={{ display: "none" }}
                        />
                        Add Photo
                      </label>
                    </div>
                  ) : (
                    <div className={styles.Photo} key={index}>
                      {photo ? (
                        <>
                          <div
                            className={styles.Delete}
                            onClick={() => handlePhotoDelete(index)}
                          >
                            <div className={styles.DeleteButton}>
                              <DeleteOutlined />
                            </div>
                          </div>
                          <img
                            className={styles.Image}
                            src={photo}
                            alt="image"
                          />
                        </>
                      ) : (
                        <CameraOutlined />
                      )}
                    </div>
                  )
                )}
              </div>
              <div className={styles.MainInfo}>
                <div className={styles.InputContainer}>
                  <p className={styles.Caption}>Name</p>
                  <Input
                    name="first_name"
                    placeholder="Name"
                    className={styles.Param}
                    value={user.first_name}
                    onChange={updateUserInfo}
                  />
                </div>
                <div className={styles.InputContainer}>
                  <p className={styles.Caption}>Surname</p>
                  <Input
                    name="last_name"
                    placeholder="Surname"
                    className={styles.Param}
                    value={user.last_name}
                    onChange={updateUserInfo}
                  />
                </div>
                <div className={styles.InputContainer}>
                  <p className={styles.Caption}>Username</p>
                  <Input
                    name="username"
                    placeholder="Nickname"
                    className={styles.Param}
                    value={user.username}
                    onChange={updateUserInfo}
                  />
                </div>
                <div className={styles.InputContainer}>
                  <p className={styles.Caption}>Address</p>
                  <PlacesAutocomplete
                    onSelectLocation={handleCityUpdate}
                    initialValue={user.city}
                    cancelChanges={cancelAddress}
                  />
                </div>
                <div className={styles.InputContainer}>
                  <p className={styles.Caption}>Gender</p>
                  <Select
                    name="gender"
                    placeholder="Gender"
                    className={styles.Select}
                    value={user.gender}
                    onChange={(value) => setUser({ ...user, gender: value })}
                  >
                    <Option value="MALE">Male</Option>
                    <Option value="FEMALE">Female</Option>
                    <Option value="OTHER">Other</Option>
                  </Select>
                </div>
                <div className={styles.InputContainer}>
                  <p className={styles.Caption}>Birthday</p>
                  <DatePicker
                    className={styles.Param}
                    format={"YYYY-MM-DD"}
                    name="birth_date"
                    value={user.birth_date ? user.birth_date : null}
                    onChange={(value) =>
                      setUser({ ...user, birth_date: value })
                    }
                  />
                </div>
                <div className={styles.InputContainer}>
                  <Checkbox
                    checked={user.show_email}
                    name="show_email"
                    onChange={updateUserInfo}
                    value={!user.show_email}
                  >
                    <p className={styles.Caption}>Show e-mail for others</p>
                  </Checkbox>
                </div>
              </div>
            </div>
            <div className={styles.Description}>
              <p className={styles.Caption}>About</p>
              <TextArea
                autoSize={{ minRows: 5, maxRows: 5 }}
                name="description"
                placeholder="Enter description..."
                className={styles.TextArea}
                value={user.description}
                onChange={updateUserInfo}
              />
            </div>
            <div className={styles.Buttons}>
              <CancelButton onclick={handleCancel} />
              <ApplyChangesButton onClick={applyChanges} />
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default EditUserProfile;
