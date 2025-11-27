import React, { useState, useCallback, useMemo } from "react";
import { useThemeContext } from "../ThemeProvider";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { collection, query, where, getDocs } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";
import Svg, { Path, Circle, Line, Rect } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 180;

const Statistiques = () => {
  const { isDarkMode } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [stats, setStats] = useState({
    // Stats de base
    totalEvents: 0,
    activeEvents: 0,
    pastEvents: 0,
    totalParticipations: 0,
    pendingRequests: 0,
    // Stats Pro - Revenus
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalSales: 0,
    // Stats Pro - Engagement
    totalConfirmedParticipants: 0,
    pendingParticipantsReceived: 0,
    averageFillRate: 0,
    mostPopularEvent: null,
    // Stats Pro - Visibilité
    totalSaved: 0,
    totalMessages: 0,
    totalViews: 0,
    // Stats Pro - Historique mensuel
    eventsThisMonth: 0,
    eventsLastMonth: 0,
    monthlyData: [],
  });

  const fetchStatistics = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Récupérer les infos utilisateur pour vérifier si Pro
      const userDoc = await getDocs(query(
        collection(db, "users"),
        where("__name__", "==", currentUser.uid)
      ));

      let userIsPro = false;
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        userIsPro = userData.sub === "pro" || userData.sub === "enterprise";
        setIsPro(userIsPro);
      }

      // Récupérer les événements créés par l'utilisateur
      const createdEventsQuery = query(
        collection(db, "activities"),
        where("creatorId", "==", currentUser.uid)
      );
      const createdEventsSnapshot = await getDocs(createdEventsQuery);
      const createdEvents = createdEventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Dates pour les calculs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      // Calculer les statistiques de base
      let activeCount = 0;
      let pastCount = 0;
      let totalConfirmedParticipants = 0;
      let pendingParticipantsReceived = 0;
      let totalMaxParticipants = 0;
      let mostPopularEvent = null;
      let maxParticipants = 0;
      let eventsThisMonth = 0;
      let eventsLastMonth = 0;

      createdEvents.forEach((event) => {
        const [day, month, year] = event.date.split("/").map(Number);
        const eventDate = new Date(year, month - 1, day);
        const eventCreatedAt = event.createdAt ? new Date(event.createdAt) : null;

        if (eventDate >= today) {
          activeCount++;
        } else {
          pastCount++;
        }

        // Comptage des événements par mois (basé sur la date de création)
        if (eventCreatedAt) {
          if (eventCreatedAt >= thisMonthStart) {
            eventsThisMonth++;
          } else if (eventCreatedAt >= lastMonthStart && eventCreatedAt <= lastMonthEnd) {
            eventsLastMonth++;
          }
        }

        // Stats Pro - Participants
        const participants = event.participants || [];
        const confirmedCount = participants.filter(p => p.active).length;
        const pendingCount = participants.filter(p => !p.active).length;

        totalConfirmedParticipants += confirmedCount;
        pendingParticipantsReceived += pendingCount;
        totalMaxParticipants += event.maxParticipants || 0;

        // Événement le plus populaire
        if (confirmedCount > maxParticipants) {
          maxParticipants = confirmedCount;
          mostPopularEvent = {
            title: event.title,
            participants: confirmedCount,
            maxParticipants: event.maxParticipants,
          };
        }
      });

      // Taux de remplissage moyen
      const averageFillRate = totalMaxParticipants > 0
        ? Math.round((totalConfirmedParticipants / totalMaxParticipants) * 100)
        : 0;

      // Stats Pro - Revenus (depuis la collection payments)
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let totalSales = 0;

      if (userIsPro) {
        try {
          // Récupérer les paiements pour les événements de l'utilisateur
          const eventIds = createdEvents.map(e => e.id);

          if (eventIds.length > 0) {
            // Firebase ne supporte pas "in" avec plus de 10 éléments
            const chunks = [];
            for (let i = 0; i < eventIds.length; i += 10) {
              chunks.push(eventIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
              const paymentsQuery = query(
                collection(db, "payments"),
                where("activityId", "in", chunk)
              );
              const paymentsSnapshot = await getDocs(paymentsQuery);

              paymentsSnapshot.docs.forEach((doc) => {
                const payment = doc.data();
                const amount = Number(payment.amount) || 0;
                totalRevenue += amount;
                totalSales++;

                const paymentDate = payment.createdAt ? new Date(payment.createdAt) : null;
                if (paymentDate && paymentDate >= thisMonthStart) {
                  monthlyRevenue += amount;
                }
              });
            }
          }
        } catch (error) {
          console.log("Erreur récupération paiements:", error);
        }

        // Stats Pro - Événements sauvegardés
        try {
          const eventIds = createdEvents.map(e => e.id);
          let totalSaved = 0;

          if (eventIds.length > 0) {
            const chunks = [];
            for (let i = 0; i < eventIds.length; i += 10) {
              chunks.push(eventIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
              const savedQuery = query(
                collection(db, "saved"),
                where("activityId", "in", chunk)
              );
              const savedSnapshot = await getDocs(savedQuery);
              totalSaved += savedSnapshot.size;
            }
          }

          stats.totalSaved = totalSaved;
        } catch (error) {
          console.log("Erreur récupération saved:", error);
        }

        // Stats Pro - Messages dans les conversations
        try {
          const eventIds = createdEvents.map(e => e.id);
          let totalMessages = 0;

          if (eventIds.length > 0) {
            const chunks = [];
            for (let i = 0; i < eventIds.length; i += 10) {
              chunks.push(eventIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
              const conversationsQuery = query(
                collection(db, "conversations"),
                where("activityId", "in", chunk)
              );
              const conversationsSnapshot = await getDocs(conversationsQuery);

              for (const convDoc of conversationsSnapshot.docs) {
                const messagesQuery = query(
                  collection(db, "messages"),
                  where("conversationId", "==", convDoc.id)
                );
                const messagesSnapshot = await getDocs(messagesQuery);
                totalMessages += messagesSnapshot.size;
              }
            }
          }

          stats.totalMessages = totalMessages;
        } catch (error) {
          console.log("Erreur récupération messages:", error);
        }

        // Stats Pro - Vues totales (calculées depuis le champ views des activités)
        let totalViews = 0;
        createdEvents.forEach((event) => {
          totalViews += event.views || 0;
        });
        stats.totalViews = totalViews;
      }

      // Compter les participations de l'utilisateur (comme avant)
      const allActivitiesSnapshot = await getDocs(collection(db, "activities"));
      let participationCount = 0;
      let pendingCount = 0;

      allActivitiesSnapshot.docs.forEach((doc) => {
        const activity = doc.data();
        const participants = activity.participants || [];
        const userParticipation = participants.find(
          (p) => p.userId === currentUser.uid
        );

        if (userParticipation) {
          participationCount++;
          if (!userParticipation.active) {
            pendingCount++;
          }
        }
      });

      // Générer les données mensuelles pour le graphique (6 derniers mois)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

        let count = 0;
        createdEvents.forEach((event) => {
          const eventCreatedAt = event.createdAt ? new Date(event.createdAt) : null;
          if (eventCreatedAt && eventCreatedAt >= monthDate && eventCreatedAt <= monthEnd) {
            count++;
          }
        });

        monthlyData.push({
          month: monthDate.toLocaleString('default', { month: 'short' }),
          count,
        });
      }

      setStats({
        totalEvents: createdEvents.length,
        activeEvents: activeCount,
        pastEvents: pastCount,
        totalParticipations: participationCount,
        pendingRequests: pendingCount,
        // Pro stats
        totalRevenue,
        monthlyRevenue,
        totalSales,
        totalConfirmedParticipants,
        pendingParticipantsReceived,
        averageFillRate,
        mostPopularEvent,
        totalSaved: stats.totalSaved || 0,
        totalMessages: stats.totalMessages || 0,
        totalViews: stats.totalViews || 0,
        eventsThisMonth,
        eventsLastMonth,
        monthlyData,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStatistics();
    }, [fetchStatistics])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatistics();
  }, [fetchStatistics]);

  // Composant StatCard amélioré
  const StatCard = useCallback(
    ({ icon, title, value, subtitle, color, index, gradient }) => (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 80)}
        style={styles.statCardWrapper}
      >
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderColor: isDarkMode ? `${color}30` : `${color}15`,
            },
          ]}
        >
          {gradient ? (
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainerGradient}
            >
              <MaterialCommunityIcons name={icon} size={28} color="#FFFFFF" />
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${color}15` },
              ]}
            >
              <MaterialCommunityIcons name={icon} size={28} color={color} />
            </View>
          )}

          <View style={styles.statContent}>
            <Text
              style={[
                styles.statValue,
                { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
              ]}
            >
              {value}
            </Text>
            <Text
              style={[
                styles.statTitle,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[
                  styles.statSubtitle,
                  { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>

          <View style={[styles.colorAccent, { backgroundColor: color }]} />
        </View>
      </Animated.View>
    ),
    [isDarkMode]
  );

  // Composant pour les grandes cartes de stats Pro
  const ProStatCard = useCallback(
    ({ icon, title, value, unit, color, gradient, index }) => (
      <Animated.View
        entering={FadeInUp.duration(500).delay(index * 100)}
        style={styles.proStatCardWrapper}
      >
        <LinearGradient
          colors={gradient || [color, `${color}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.proStatCard}
        >
          <View style={styles.proStatIconContainer}>
            <MaterialCommunityIcons name={icon} size={32} color="#FFFFFF" />
          </View>
          <View style={styles.proStatContent}>
            <Text style={styles.proStatValue}>
              {value}
              {unit && <Text style={styles.proStatUnit}> {unit}</Text>}
            </Text>
            <Text style={styles.proStatTitle}>{title}</Text>
          </View>
          <View style={styles.proStatDecor} />
        </LinearGradient>
      </Animated.View>
    ),
    []
  );

  // Graphique en ligne simple
  const LineChart = useMemo(() => {
    const data = stats.monthlyData;
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.count), 1);
    const padding = 30;
    const chartW = CHART_WIDTH - padding * 2;
    const chartH = CHART_HEIGHT - padding * 2;
    const stepX = chartW / (data.length - 1);

    const points = data.map((d, i) => ({
      x: padding + i * stepX,
      y: padding + chartH - (d.count / maxValue) * chartH,
    }));

    const pathData = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    const areaPath = `${pathData} L ${points[points.length - 1].x} ${padding + chartH} L ${padding} ${padding + chartH} Z`;

    return (
      <Animated.View
        entering={FadeIn.duration(600).delay(400)}
        style={[
          styles.chartContainer,
          { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
        ]}
      >
        <Text style={[styles.chartTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
          {i18n.t("evolution_evenements")}
        </Text>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Lignes de grille */}
          {[0, 1, 2, 3].map((i) => (
            <Line
              key={i}
              x1={padding}
              y1={padding + (chartH / 3) * i}
              x2={CHART_WIDTH - padding}
              y2={padding + (chartH / 3) * i}
              stroke={isDarkMode ? "#27272A" : "#E5E7EB"}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          {/* Zone sous la courbe */}
          <Path
            d={areaPath}
            fill={`${COLORS.primary}20`}
          />

          {/* Ligne principale */}
          <Path
            d={pathData}
            fill="none"
            stroke={COLORS.primary}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={6}
              fill={COLORS.primary}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          ))}

          {/* Labels mois */}
          {data.map((d, i) => (
            <React.Fragment key={i}>
              <Rect
                x={points[i].x - 20}
                y={CHART_HEIGHT - 20}
                width={40}
                height={20}
                fill="transparent"
              />
            </React.Fragment>
          ))}
        </Svg>
        <View style={styles.chartLabels}>
          {data.map((d, i) => (
            <Text
              key={i}
              style={[
                styles.chartLabel,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" }
              ]}
            >
              {d.month}
            </Text>
          ))}
        </View>
      </Animated.View>
    );
  }, [stats.monthlyData, isDarkMode]);

  // Barre de progression du taux de remplissage
  const FillRateBar = useMemo(() => {
    const rate = stats.averageFillRate;
    const color = rate >= 70 ? "#10B981" : rate >= 40 ? "#F59E0B" : "#EF4444";

    return (
      <Animated.View
        entering={FadeIn.duration(500).delay(500)}
        style={[
          styles.fillRateContainer,
          { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
        ]}
      >
        <View style={styles.fillRateHeader}>
          <Text style={[styles.fillRateTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
            {i18n.t("taux_remplissage_moyen")}
          </Text>
          <Text style={[styles.fillRateValue, { color }]}>
            {rate}%
          </Text>
        </View>
        <View style={[styles.fillRateBarBg, { backgroundColor: isDarkMode ? "#27272A" : "#E5E7EB" }]}>
          <Animated.View
            style={[
              styles.fillRateBarFill,
              { width: `${rate}%`, backgroundColor: color }
            ]}
          />
        </View>
        <Text style={[styles.fillRateSubtitle, { color: isDarkMode ? "#6B7280" : "#9CA3AF" }]}>
          {stats.totalConfirmedParticipants} {i18n.t("participants_confirmes")}
        </Text>
      </Animated.View>
    );
  }, [stats.averageFillRate, stats.totalConfirmedParticipants, isDarkMode]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {i18n.t("chargement")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" }]}>
      <View style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" }]}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.header,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderBottomColor: isDarkMode ? "#1F1F1F" : "#F3F4F6",
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <Text
                style={[
                  styles.headerTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("statistiques")}
              </Text>
              {isPro && (
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.proBadge}
                >
                  <Text style={styles.proBadgeText}>PRO</Text>
                </LinearGradient>
              )}
            </View>
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {i18n.t("vue_densemble_de_votre_activite")}
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Section Stats Pro - Revenus (si Pro) */}
          {isPro && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  {i18n.t("revenus")}
                </Text>
              </View>

              <View style={styles.proStatsRow}>
                <ProStatCard
                  icon="cash-multiple"
                  title={i18n.t("revenus_totaux")}
                  value={stats.totalRevenue.toFixed(2)}
                  unit="€"
                  gradient={["#10B981", "#059669"]}
                  index={0}
                />
                <ProStatCard
                  icon="calendar-month"
                  title={i18n.t("ce_mois")}
                  value={stats.monthlyRevenue.toFixed(2)}
                  unit="€"
                  gradient={["#3B82F6", "#1D4ED8"]}
                  index={1}
                />
              </View>

              <StatCard
                icon="receipt"
                title={i18n.t("ventes_totales")}
                value={stats.totalSales}
                subtitle={i18n.t("paiements_recus")}
                color="#8B5CF6"
                index={2}
              />
            </View>
          )}

          {/* Section Stats Pro - Engagement (si Pro) */}
          {isPro && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={20} color={COLORS.primary} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  {i18n.t("engagement")}
                </Text>
              </View>

              {FillRateBar}

              <View style={styles.statsGrid}>
                <StatCard
                  icon="account-check"
                  title={i18n.t("participants_confirmes")}
                  value={stats.totalConfirmedParticipants}
                  color="#10B981"
                  index={3}
                />
                <StatCard
                  icon="account-clock"
                  title={i18n.t("demandes_recues")}
                  value={stats.pendingParticipantsReceived}
                  color="#F59E0B"
                  index={4}
                />
              </View>

              {stats.mostPopularEvent && (
                <Animated.View
                  entering={FadeIn.duration(500).delay(400)}
                  style={[
                    styles.popularEventCard,
                    { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
                  ]}
                >
                  <LinearGradient
                    colors={[`${COLORS.primary}20`, `${COLORS.secondary}10`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.popularEventGradient}
                  >
                    <View style={styles.popularEventIcon}>
                      <Ionicons name="trophy" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.popularEventContent}>
                      <Text style={[styles.popularEventLabel, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
                        {i18n.t("evenement_plus_populaire")}
                      </Text>
                      <Text style={[styles.popularEventTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]} numberOfLines={1}>
                        {stats.mostPopularEvent.title}
                      </Text>
                      <Text style={[styles.popularEventStats, { color: COLORS.primary }]}>
                        {stats.mostPopularEvent.participants}/{stats.mostPopularEvent.maxParticipants} {i18n.t("participants").toLowerCase()}
                      </Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}
            </View>
          )}

          {/* Section Stats Pro - Visibilité (si Pro) */}
          {isPro && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  {i18n.t("visibilite")}
                </Text>
              </View>

              <StatCard
                icon="eye"
                title={i18n.t("vues_totales")}
                value={stats.totalViews}
                subtitle={i18n.t("visiteurs_uniques")}
                color="#8B5CF6"
                index={5}
              />

              <View style={styles.statsGrid}>
                <StatCard
                  icon="bookmark-multiple"
                  title={i18n.t("evenements_sauvegardes")}
                  value={stats.totalSaved}
                  subtitle={i18n.t("dans_les_agendas")}
                  color="#EC4899"
                  index={6}
                />
                <StatCard
                  icon="message-text"
                  title={i18n.t("messages_discussions")}
                  value={stats.totalMessages}
                  subtitle={i18n.t("dans_vos_evenements")}
                  color="#06B6D4"
                  index={7}
                />
              </View>
            </View>
          )}

          {/* Graphique d'évolution (si Pro) */}
          {isPro && stats.monthlyData.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up-outline" size={20} color={COLORS.primary} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  {i18n.t("evolution")}
                </Text>
              </View>
              {LineChart}
            </View>
          )}

          {/* Section événements créés (pour tous) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("mes_evenements")}
              </Text>
            </View>

            <StatCard
              icon="calendar-star"
              title={i18n.t("evenements_crees")}
              value={stats.totalEvents}
              color="#3B82F6"
              index={7}
              gradient={[COLORS.primary, COLORS.secondary]}
            />

            <View style={styles.statsGrid}>
              <StatCard
                icon="calendar-check"
                title={i18n.t("evenements_actifs")}
                value={stats.activeEvents}
                color="#10B981"
                index={8}
              />

              <StatCard
                icon="calendar-remove"
                title={i18n.t("evenements_passes")}
                value={stats.pastEvents}
                color="#6B7280"
                index={9}
              />
            </View>

            {/* Comparaison mensuelle */}
            {isPro && (
              <Animated.View
                entering={FadeIn.duration(500).delay(500)}
                style={[
                  styles.comparisonCard,
                  { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
                ]}
              >
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonItem}>
                    <Text style={[styles.comparisonValue, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                      {stats.eventsThisMonth}
                    </Text>
                    <Text style={[styles.comparisonLabel, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
                      {i18n.t("ce_mois")}
                    </Text>
                  </View>
                  <View style={styles.comparisonDivider} />
                  <View style={styles.comparisonItem}>
                    <Text style={[styles.comparisonValue, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                      {stats.eventsLastMonth}
                    </Text>
                    <Text style={[styles.comparisonLabel, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
                      {i18n.t("mois_dernier")}
                    </Text>
                  </View>
                  <View style={styles.comparisonDivider} />
                  <View style={styles.comparisonItem}>
                    <Text style={[
                      styles.comparisonValue,
                      {
                        color: stats.eventsThisMonth >= stats.eventsLastMonth
                          ? "#10B981"
                          : "#EF4444"
                      }
                    ]}>
                      {stats.eventsThisMonth >= stats.eventsLastMonth ? "+" : ""}
                      {stats.eventsThisMonth - stats.eventsLastMonth}
                    </Text>
                    <Text style={[styles.comparisonLabel, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
                      {i18n.t("evolution")}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>

          {/* Section participations (pour tous) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("mes_participations")}
              </Text>
            </View>

            <StatCard
              icon="account-group"
              title={i18n.t("participations_totales")}
              value={stats.totalParticipations}
              color="#8B5CF6"
              index={10}
            />

            <StatCard
              icon="clock-outline"
              title={i18n.t("demandes_en_attente")}
              value={stats.pendingRequests}
              color="#F59E0B"
              index={11}
            />
          </View>

          {/* Message vide si aucune activité */}
          {stats.totalEvents === 0 && stats.totalParticipations === 0 && (
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.emptyState}
            >
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={[`${COLORS.primary}20`, `${COLORS.secondary}10`]}
                  style={styles.emptyIconGradient}
                >
                  <MaterialCommunityIcons
                    name="chart-box-outline"
                    size={56}
                    color={COLORS.primary}
                  />
                </LinearGradient>
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("aucune_statistique")}
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {i18n.t("commencez_a_creer_ou_rejoindre_des_evenements")}
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    gap: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  proBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCardWrapper: {
    flex: 1,
    marginBottom: 12,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconContainerGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  statSubtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  colorAccent: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  // Pro Stats Cards
  proStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  proStatCardWrapper: {
    flex: 1,
  },
  proStatCard: {
    padding: 20,
    borderRadius: 20,
    position: "relative",
    overflow: "hidden",
    minHeight: 120,
  },
  proStatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  proStatContent: {
    zIndex: 2,
  },
  proStatValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  proStatUnit: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  proStatTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
  },
  proStatDecor: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  // Fill Rate Bar
  fillRateContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  fillRateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  fillRateTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  fillRateValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  fillRateBarBg: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  fillRateBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  fillRateSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  // Popular Event Card
  popularEventCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
  },
  popularEventGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  popularEventIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  popularEventContent: {
    flex: 1,
  },
  popularEventLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  popularEventTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
  popularEventStats: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  // Chart
  chartContainer: {
    padding: 20,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 16,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  chartLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  // Comparison Card
  comparisonCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  comparisonItem: {
    alignItems: "center",
  },
  comparisonValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  comparisonLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  comparisonDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default Statistiques;
