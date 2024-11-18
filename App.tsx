import 'react-native-gesture-handler'; // This should be at the very top of the file
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, TextInput, Button, Text, StyleSheet, View, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ScrollView } from 'react-native-gesture-handler';
import UploadForm from './src/components/UploadForm';
import { WebView } from 'react-native-webview';
import type { WebView as WebViewType } from 'react-native-webview';




const Stack = createStackNavigator();

const LoginScreen = ({ navigation }) => {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');


  const handleLogin = async () => {
    try {
      const response = await fetch('https://image360.oppget.com/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access) {
          await AsyncStorage.setItem('accessToken', data.access);
          await AsyncStorage.setItem('refreshToken', data.refresh);
          console.log('Access token saved successfully:', data.access);

          // Navigate to the Home screen
          navigation.navigate('Home');
        } else {
          setErrorMessage('No access token found');
        }
      } else {
        const data = await response.json();
        setErrorMessage(data.message);
      }
    } catch (error) {
      setErrorMessage('An error occurred: ' + error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUserName}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Button title="Login" onPress={handleLogin} />
    </SafeAreaView>
  );
};

const HomeScreen = ({navigation}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    

    const fetchData = async () => {
        try {
          const accessToken = await AsyncStorage.getItem('accessToken');
          if (!accessToken) {
            throw new Error('No access token found');
          }
          const response = await fetch('https://image360.oppget.com/api/user-photo/', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch data');
          }
          const responseData = await response.json();
          setData(responseData);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

    const handleDelete = async (id) => {
        try {
          const accessToken = await AsyncStorage.getItem('accessToken');
          if (!accessToken) {
            throw new Error('No access token found');
          }
    
          const response = await fetch(`https://image360.oppget.com/api/${id}/delete/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
    
          if (!response.ok) {
            throw new Error('Failed to delete item');
          }
    
          // Refresh the data after deletion
          fetchData(); // Re-fetch data to see the updated list
        } catch (error) {
          setError(error.message);
        }
      };

      const handleImagePress = (imageUrl) => {
        navigation.navigate('ViewerScreen', { imageUrl });
      };
    

    useEffect(() => {

      fetchData();
    }, []);

    if (loading) {
      return <ActivityIndicator size="large" color="#0000ff" />;
    }

    if (error) {
      return <Text style={styles.error}>Error: {error}</Text>;
    }

    return (
        <ScrollView style={styles.container}>
            <Button
        title="Go to Upload Form"
        onPress={() => navigation.navigate('UploadForm')}
      />
          {data.length > 0 ? (
            data.map((item) => (
              <View key={item.id} style={styles.itemContainer}>
                <TouchableOpacity onPress={() => handleImagePress(item.image)}>
                    <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                </TouchableOpacity>
                <Text style={styles.itemText}>ID: {item.id}</Text>
                <Text style={styles.itemText}>Name: {item.name}</Text>
                <Text style={styles.itemText}>Description: {item.description}</Text>
                <Text style={styles.itemText}>Attribution: {item.attribution}</Text>
                <Text style={styles.itemText}>License Link: {item.license_link}</Text>
                <Text style={styles.itemText}>Date Taken: {item.date_taken}</Text>
                <Text style={styles.itemText}>Camera Model: {item.camera_model}</Text>
                <Text style={styles.itemText}>Category: {item.category}</Text>
                <Text style={styles.itemText}>Order: {item.order}</Text>

                <Text style={styles.itemText}>Image: {item.image}</Text>
                <Button title="Delete" onPress={() => handleDelete(item.id)} color="red" />
              </View>
            ))
          ) : (
            <Text>No data available</Text>
          )}
        </ScrollView>
      );
    };
    

// const ViewerScreenVer1 = ({ route }) => {
//         const { imageUrl } = route.params;
//         const webviewRef = useRef(null);
//         console.log(imageUrl)
//         const html = `
//             <!DOCTYPE html>
//             <html lang="en">
//             <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>Viewer</title>
//             </head>
//             <body>
//                 <h1 id="displayText">Waiting for image URL...</h1>
//                 <button onclick="loadImageUrl()">Load Image URL</button>
    
//                 <script>
//                     // Function to load the imageUrl (from React Native) into the h1 element when the button is clicked
//                     function loadImageUrl() {
//                         if (window.imageUrl) {
//                             document.getElementById("displayText").innerText = window.imageUrl;
//                         } else {
//                             document.getElementById("displayText").innerText = "No image URL received.";
//                         }
//                     }
//                 </script>
//             </body>
//             </html>
//         `;
    
//         const injectedJavaScriptBeforeContentLoaded = `
//             // Assign imageUrl from React Native to a global variable in the WebView context
//             window.imageUrl = "${imageUrl}";
//             true; // This line is required for the WebView to acknowledge the script is complete
//         `;
    
//         return (
//             <WebView
//                 ref={webviewRef}
//                 originWhitelist={['*']}
//                 source={{ html }}
//                 style={{ flex: 1 }}
//                 injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded} 
//             />
//         );
//     };

const ViewerScreen = ({ route }) => {
    const { imageUrl } = route.params;
    const webviewRef = useRef(null);

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>360 Viewer</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/marzipano/0.10.2/marzipano.js" 
                integrity="sha512-ir2jZ6Hz/Cf+gtVoZGAeKluqMN8xD9IY1vl1/2zL+xGGJfi92roMegfbqoKyZXEc8NALMKP/j/uRRhKuUirVuA==" 
                crossorigin="anonymous" referrerpolicy="no-referrer"></script>
        <style>
            #viewer {
                width: 100%;
                height: 100vh;
                visibility: hidden;
            }
            #displayText {
                margin: 20px;
                text-align: center;
            }
            button {
                display: block;
                margin: 20px auto;
            }
        </style>
    </head>
    <body>
        <h1 id="displayText">Click the button to view the 360 image</h1>
        <button id="loadButton">Load 360 Image</button>
        <div id="viewer"></div>

        <script>
            window.ReactNativeWebView.postMessage("Script loaded");

            function logMessage(message) {
                window.ReactNativeWebView.postMessage(message);
            }

            window.loadImageUrl = function() {
                logMessage("Inside loadImageUrl function");

                if (typeof Marzipano === 'undefined') {
                    logMessage("Marzipano is not defined");
                    return;
                }

                if (window.imageUrl) {
                    logMessage("imageUrl found: " + window.imageUrl);

                    document.getElementById("displayText").style.display = 'none';
                    document.getElementById("viewer").style.visibility = 'visible';

                    try {
                        const viewer = new Marzipano.Viewer(document.getElementById('viewer'));
                        const source = Marzipano.ImageUrlSource.fromString(window.imageUrl);
                        const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
                        const limiter = Marzipano.RectilinearView.limit.traditional(4096, 90 * Math.PI / 180);
                        const view = new Marzipano.RectilinearView(null, limiter);

                        const scene = viewer.createScene({
                            source: source,
                            geometry: geometry,
                            view: view,
                            pinFirstLevel: true
                        });

                        scene.switchTo();
                        logMessage("Scene switched successfully");
                    } catch (error) {
                        logMessage("Error in Marzipano setup: " + error.message);
                    }
                } else {
                    logMessage("No image URL received.");
                    document.getElementById("displayText").innerText = "No image URL received.";
                }
            };

            window.addEventListener("load", function() {
                const button = document.getElementById("loadButton");
                if (button) {
                    button.addEventListener("click", function() {
                        logMessage("Button clicked");
                        window.loadImageUrl();
                    });
                }
            });
        </script>
    </body>
    </html>
    `;

    const injectedJavaScriptBeforeContentLoaded = `
        window.imageUrl = "${imageUrl}";
        true;
    `;

    return (
        <WebView
            ref={webviewRef}
            originWhitelist={['*']}
            source={{ html }}
            style={{ flex: 1 }}
            injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
            onMessage={(event) => console.log("WebView log:", event.nativeEvent.data)}
        />
    );
};





    
    
    


const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="UploadForm" component={UploadForm} />
        <Stack.Screen name="ViewerScreen" component={ViewerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    padding: 8,
  },
  error: {
    color: 'red',
    marginBottom: 12,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 5,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 10,
  },
});

export default App;
