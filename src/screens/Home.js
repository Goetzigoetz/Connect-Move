import React from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { ArrowRightIcon } from 'react-native-heroicons/outline';


import firestore from '@react-native-firebase/firestore';

/**
 * Fonction pour ajouter des catégories et des activités dans Firestore.
 * @returns {Promise<void>}
 */
const addDoc = async () => {
  try {
    // Ajout des catégories
    const categories = [
      { name: "Running", description: "Activités de course à pied" },
      { name: "Yoga", description: "Activités de yoga et méditation" },
      { name: "Randonnée", description: "Activités de marche et randonnée" },
      { name: "Sports collectifs", description: "Activités en équipe, comme le football ou le basket" },
    ];

    console.log("Ajout des catégories...");
    const categoryRefs = {};
    for (const category of categories) {
      const categoryRef = await firestore().collection('categories').add(category);
      categoryRefs[category.name] = categoryRef.id;
    }

    // Ajout des activités
    console.log("Ajout des activités...");
    const activities = [
      {
        title: "Running au parc de la Tête d'Or",
        description: "Rejoignez-nous pour une séance de running dans un cadre magnifique.",
        location: "Lyon",
        category: categoryRefs["Running"], // Référence à la catégorie
        date: new Date('2024-11-20T10:00:00Z'),
        participants: 5,
        maxParticipants: 10,
        image: "https://via.placeholder.com/400x200",
      },
      {
        title: "Session de yoga au bord de la plage",
        description: "Une séance relaxante pour débutants et confirmés.",
        location: "Nice",
        category: categoryRefs["Yoga"],
        date: new Date('2024-11-22T08:00:00Z'),
        participants: 3,
        maxParticipants: 15,
        image: "https://via.placeholder.com/400x200",
      },
      {
        title: "Randonnée sur le Mont Blanc",
        description: "Une aventure inoubliable dans les Alpes.",
        location: "Chamonix",
        category: categoryRefs["Randonnée"],
        date: new Date('2024-11-23T07:00:00Z'),
        participants: 7,
        maxParticipants: 10,
        image: "https://via.placeholder.com/400x200",
      },
      {
        title: "Match de football amateur",
        description: "Un match convivial pour tous les niveaux.",
        location: "Paris",
        category: categoryRefs["Sports collectifs"],
        date: new Date('2024-11-25T14:00:00Z'),
        participants: 18,
        maxParticipants: 22,
        image: "https://via.placeholder.com/400x200",
      },
    ];

    for (const activity of activities) {
      await firestore().collection('activities').add(activity);
    }

    console.log("Catégories et activités ajoutées avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'ajout des données :", error);
  }
};





const Home = () => {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Message d’accueil */}
      <View className="p-6 bg-blue-600">
        <Text className="text-white text-2xl font-bold text-center">
          Trouvez votre prochain partenaire d'activité
        </Text>
      </View>

      {/* Visuel dynamique */}
      <Image
        source={{ uri: 'https://via.placeholder.com/400x200' }}
        className="w-full h-48"
        resizeMode="cover"
      />

      {/* Boutons CTA */}
      <View className="mt-4 flex-col justify-around px-4">
        <TouchableOpacity className="bg-blue-600 py-3 px-6 rounded-lg mb-3">
          <Text className="text-white text-lg font-semibold">S'inscrire/Se connecter</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-gray-200 py-3 px-6 rounded-lg">
          <Text className="text-blue-600 text-lg font-semibold">Découvrir les activités</Text>
        </TouchableOpacity>
      </View>

      {/* Champ de recherche */}
      <View className="p-4 mt-6">
        <TextInput
          placeholder="Rechercher une activité"
          className="border border-gray-300 rounded-lg px-4 py-3"
        />
      </View>

      {/* Aperçu des activités */}
      <View className="p-4">
        <Text className="text-xl font-semibold mb-4">Activités populaires près de chez vous</Text>
        <ScrollView horizontal>
          {/* Exemple d'activité */}
          <View className="mr-4 bg-white shadow rounded-lg p-4">
            <Image
              source={{ uri: 'https://via.placeholder.com/150x100' }}
              className="w-36 h-24 rounded"
            />
            <Text className="mt-2 font-semibold">Running à Paris</Text>
            <TouchableOpacity className="mt-2 flex-row items-center">
              <Text className="text-blue-600">Voir plus</Text>
              <ArrowRightIcon size={16} color="#1E40AF" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

export default Home;
