import React, { useState } from 'react';
import { View, Button, Image, Alert, ActivityIndicator, StyleSheet, Text, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImageResizer from 'react-native-image-resizer';

const UploadForm = () => {
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageName, setImageName] = useState('');
  const [title,setTitle] = useState('');
  const [description,setDescription] = useState('');
  const [attribution,setAttribution] = useState('');
  const [licenseLink,setLicenseLink] = useState('');
  const [dateTaken,setDateTaken] = useState(new Date());
  const [cameraModel, setCameraModel] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [category, setCategory] = useState('OTHER');
  const [order, setOrder] = useState(1000);
  const categories = [
    { value: "OTHER", label: "Other" },
    { value: "AUTOMOTIVE", label: "Automotive" },
    { value: "REAL_ESTATE", label: "Real Estate" },
    { value: "CONSTRUCTION", label: "Construction" },
    { value: "GIS", label: "GIS" }
  ];

  const chooseDate = (event, selectedDate) => {
    const currentDate = selectedDate || dateTaken;
    setShowDate(Platform.OS === 'ios');
    setDateTaken(currentDate);
  };

  const showDatepicker = () => {
    setShowDate(true);
  }

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        Alert.alert('Image selection canceled');
      } else if (response.errorMessage) {
        Alert.alert('Error: ' + response.errorMessage);
      } else {
        const uri = response.assets[0].uri;
        setImageUri(uri);
      }
    });
  };

  const compressImage = async (imageUri) => {
    try {
      const response = await ImageResizer.createResizedImage(
        imageUri,
        800,
        600,
        'JPEG',
        80
      );
      return response.uri;
    } catch (error) {
      console.error(error);
      Alert.alert('Image compression failed: ' + error.message);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('Please select an image first');
      return;
    }
    if (!title) {
        Alert.alert('Please provide a title.');
        return;
      }

    try {
      const compressedImageUri = await compressImage(imageUri);

      const formData = new FormData();
      const modifiedImageName = imageName.endsWith('.jpg') ? imageName : `${imageName}.jpg`;

      formData.append('image', {
        uri: compressedImageUri,
        name: modifiedImageName,
        type: 'image/jpeg',
      });
      formData.append('title', title);
      formData.append('description', description);
      formData.append('attribution', attribution);
      formData.append('license_link', licenseLink);
      formData.append('date_taken', dateTaken.toISOString().split('T')[0]); 
      formData.append('camera_model', cameraModel);
      formData.append('category', category);
      formData.append('order', order);
      const token = await AsyncStorage.getItem('accessToken');
      setUploading(true);

      const response = await axios.post(
        'https://image360.oppget.com/api/upload-photo/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Image uploaded successfully!');
      console.log('Server response:', response.data);
    } catch (error) {
        console.log('Error Response:', error.response); // Log the error response
        Alert.alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Button title="Select Image" onPress={pickImage} />
        {imageUri && 
        <>
        <SafeAreaView style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <TextInput
          style={styles.input}
          placeholder="Name of Your Image"
          value={imageName}
          onChangeText={setImageName}
        />
        <TextInput
          style={styles.input}
          placeholder="Name of Your Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Name of Your Description"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Name of Your Attribution"
          value={attribution}
          onChangeText={setAttribution}
        />
        <TextInput
          style={styles.input}
          placeholder="Name of Your License Link"
          value={licenseLink}
          onChangeText={setLicenseLink}
        />

        {imageUri &&  (
          <DateTimePicker
           testID="dateTimePicker"
           value={dateTaken}
           mode="date"
           display="default"
           onChange={chooseDate}
          />
        )}
        

        <Text>Select Camera Model:</Text>
        <View style={styles.radioGroup}>
          {['S', 'SC2', 'SC2B', 'V', 'Z1', 'X'].map((model) => (
            <TouchableOpacity
              key={model}
              style={styles.radioOption}
              onPress={() => setCameraModel(model)}
            >
              <View style={styles.radioCircle}>
                {cameraModel === model && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.radioText}>{model}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Order"
          keyboardType="numeric"
          value={String(order)}
          onChangeText={(value)=> setOrder(parseInt(value) || 0)}
        />
        <Text>Select Category:</Text>
        <View style={styles.radioGroup}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={styles.radioOption}
              onPress={() => setCategory(cat.value)}
            >
              <View style={styles.radioCircle}>
                {category === cat.value && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.radioText}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
        </>
        }
        {uploading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button title="Upload Image" onPress={uploadImage} />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    padding: 8,
    width: '100%',
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 16,
  },
  radioGroup: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  },
  radioText: {
    fontSize: 16,
  },
});

export default UploadForm;
