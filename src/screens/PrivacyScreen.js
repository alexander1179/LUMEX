// src/screens/PrivacyScreen.js
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  StyleSheet
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Checkbox from "expo-checkbox";
import { Ionicons } from '@expo/vector-icons';
import { storageService } from '../services/storage/storageService';
import { loadSavedLanguage } from '../i18n';
import { AccessQuickNav } from '../components/common/AccessQuickNav';
import { colors } from '../styles/colors';

const icon = require('../../assets/lumex.jpeg');

export default function PrivacyScreen({ navigation, route }) {
  const { t, i18n } = useTranslation();
  const [isChecked, setChecked] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedPolicy, setExpandedPolicy] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      await loadSavedLanguage();
      // Solo redireccionar a Main si NO venimos de una pantalla que requiere aceptación (como Admin o Registro)
      const user = await storageService.checkLogin();
      if (user && !route.params?.formData && !route.params?.returnTo) {
        navigation.replace("Main");
      }
    };
    initialize();
  }, []);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const togglePolicy = (policy) => {
    setExpandedPolicy(expandedPolicy === policy ? null : policy);
  };

  const openPolicyLink = async (url, title) => {
    Alert.alert(
      title,
      t('common.openBrowser') || "¿Deseas abrir esta política en el navegador?",
      [
        { text: t('common.cancel'), style: "cancel" },
        { 
          text: t('common.open'), 
          onPress: async () => {
            try {
              const supported = await Linking.canOpenURL(url);
              if (supported) {
                await Linking.openURL(url);
              } else {
                Alert.alert(t('common.error'), t('errors.connection'));
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('errors.connection'));
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.screen}>
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      {/* Header con selector de idioma */}
      <View style={styles.header}>
        <View style={styles.headerGlow} />
        <View style={styles.headerTop}>
        </View>
        <View style={styles.logoWrap}>
          <View style={styles.logoGlowLarge} />
          <View style={styles.logoGlowSmall} />
          <View style={styles.logoFrame}>
            <Image source={icon} style={styles.logo} />
          </View>
        </View>
        <Text style={styles.mainTitle}>{t('privacy.title')}</Text>
        <Text style={styles.subTitle}>{t('privacy.subtitle')}</Text>
      </View>

      {/* SECCIÓN 1: POLÍTICA DE PRIVACIDAD Y SEGURIDAD DE LA INFORMACIÓN */}
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('politicaPrivacidad')}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#0f6d78" />
            </View>
            <Text style={styles.sectionTitle}>{t('privacy.privacyPolicy')}</Text>
          </View>
          <Ionicons
            name={expandedSection === 'politicaPrivacidad' ? 'chevron-up' : 'chevron-forward'}
            size={16}
            color="#0f6d78"
          />
        </TouchableOpacity>

        {expandedSection === 'politicaPrivacidad' && (
          <View style={styles.sectionContent}>
            <Text style={styles.text}>
              {i18n.language === 'es' 
                ? "La presente Política de Privacidad y Seguridad de la Información establece los términos en que Lumex recopila, utiliza, almacena, protege y trata la información que es proporcionada por los usuarios al utilizar la aplicación móvil y los servicios asociados. Lumex reconoce la importancia de la protección de los datos personales y, especialmente, de la información relacionada con la salud de los usuarios. Por esta razón, la plataforma adopta medidas legales, técnicas y organizativas destinadas a garantizar la privacidad, confidencialidad, integridad y disponibilidad de la información. El uso de la aplicación implica la aceptación de las condiciones establecidas en la presente política, la cual se encuentra alineada con la normativa vigente en Colombia, en particular con la Ley 1581 de 2012 de Protección de Datos Personales, el Decreto 1377 de 2013 y demás disposiciones aplicables."
                : "This Privacy and Information Security Policy establishes the terms under which Lumex collects, uses, stores, protects and processes the information provided by users when using the mobile application and associated services. Lumex recognizes the importance of protecting personal data and, especially, health-related information of users. For this reason, the platform adopts legal, technical and organizational measures aimed at guaranteeing the privacy, confidentiality, integrity and availability of information. The use of the application implies acceptance of the conditions established in this policy, which is aligned with current regulations in Colombia, in particular with Law 1581 of 2012 on Personal Data Protection, Decree 1377 of 2013 and other applicable provisions."
              }
            </Text>

            <Text style={styles.subSectionTitle}>📌 {t('privacy.collection')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex podrá recopilar información personal de los usuarios que utilicen la aplicación, incluyendo tanto pacientes como profesionales de la salud. Entre los datos que pueden ser recolectados se encuentran información de identificación como nombre, número de documento, edad, género, correo electrónico, número de teléfono e información demográfica. Asimismo, la aplicación puede recopilar información relacionada con la salud del usuario, como resultados de exámenes médicos, antecedentes clínicos, diagnósticos, tratamientos, prescripciones médicas u otra información que sea necesaria para la correcta prestación de los servicios ofrecidos dentro de la plataforma. En el caso de los profesionales de la salud, también podrá solicitarse información relacionada con su identificación profesional, especialidad médica, número de registro profesional, institución de trabajo u otros datos necesarios para verificar su condición de profesional autorizado."
                : "Lumex may collect personal information from users who use the application, including both patients and healthcare professionals. The data that may be collected includes identification information such as name, document number, age, gender, email, phone number and demographic information. Likewise, the application may collect health-related information from the user, such as medical test results, clinical history, diagnoses, treatments, medical prescriptions or other information necessary for the correct provision of the services offered within the platform. In the case of healthcare professionals, information related to their professional identification, medical specialty, professional registration number, workplace institution or other data necessary to verify their status as an authorized professional may also be requested."
              }
            </Text>

            <Text style={styles.subSectionTitle}>📌 {t('privacy.use')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "La información recopilada a través de la aplicación será utilizada con el propósito de permitir el funcionamiento del servicio ofrecido por Lumex, facilitar la interacción entre pacientes y profesionales de la salud, permitir la consulta y almacenamiento de exámenes médicos, mejorar la experiencia de los usuarios dentro de la plataforma, mantener registros internos de uso del sistema y optimizar los servicios ofrecidos. Asimismo, la información podrá utilizarse para enviar comunicaciones relacionadas con el funcionamiento de la aplicación, actualizaciones del sistema, notificaciones importantes para el usuario o información relevante sobre los servicios disponibles. En caso de enviarse comunicaciones informativas o promocionales, el usuario podrá cancelar su recepción en cualquier momento mediante los mecanismos disponibles dentro de la plataforma."
                : "The information collected through the application will be used for the purpose of allowing the operation of the service offered by Lumex, facilitating interaction between patients and healthcare professionals, allowing consultation and storage of medical exams, improving the user experience within the platform, maintaining internal records of system use and optimizing the services offered. Likewise, the information may be used to send communications related to the operation of the application, system updates, important notifications for the user or relevant information about the available services. In the case of informative or promotional communications being sent, the user may cancel their reception at any time through the mechanisms available within the platform."
              }
            </Text>

            <Text style={styles.subSectionTitle}>📌 {t('privacy.sensitiveData')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex reconoce que la información relacionada con la salud constituye datos personales sensibles, por lo que su tratamiento se realizará bajo estrictas condiciones de seguridad y confidencialidad. El manejo de estos datos se realizará conforme a los principios establecidos por la legislación colombiana, tales como legalidad, finalidad, libertad, veracidad, transparencia, acceso restringido, seguridad y confidencialidad. El tratamiento de datos sensibles solo se realizará cuando sea estrictamente necesario para la prestación del servicio y siempre contando con la autorización del titular de la información."
                : "Lumex recognizes that health-related information constitutes sensitive personal data, so its processing will be carried out under strict security and confidentiality conditions. The handling of this data will be carried out in accordance with the principles established by Colombian legislation, such as legality, purpose, freedom, truthfulness, transparency, restricted access, security and confidentiality. The processing of sensitive data will only be carried out when strictly necessary for the provision of the service and always with the authorization of the data subject."
              }
            </Text>

            <Text style={styles.subSectionTitle}>📌 {t('privacy.medicalSecret')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "En relación con la información médica tratada dentro de la plataforma, Lumex reconoce la importancia del secreto profesional médico, el cual se encuentra protegido por la legislación colombiana, particularmente por lo establecido en la Ley 23 de 1981 sobre ética médica, que establece la obligación de los profesionales de la salud de mantener la confidencialidad de toda información relacionada con el estado de salud de sus pacientes. En consecuencia, los profesionales de la salud que utilicen la plataforma se comprometen a respetar las normas éticas y legales aplicables al manejo de la información clínica, evitando la divulgación no autorizada de datos médicos. Lumex, por su parte, implementará medidas de control que permitan restringir el acceso a la información únicamente a los usuarios autorizados dentro del sistema."
                : "In relation to the medical information processed within the platform, Lumex recognizes the importance of medical professional secrecy, which is protected by Colombian legislation, particularly by Law 23 of 1981 on medical ethics, which establishes the obligation of healthcare professionals to maintain the confidentiality of all information related to the health status of their patients. Consequently, healthcare professionals who use the platform commit to respecting the ethical and legal standards applicable to the handling of clinical information, avoiding the unauthorized disclosure of medical data. Lumex, for its part, will implement control measures to restrict access to information only to authorized users within the system."
              }
            </Text>

            <Text style={styles.subSectionTitle}>📌 {t('privacy.securityMeasures')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Como parte de su compromiso con la protección de la información, Lumex implementa diversas medidas de seguridad destinadas a prevenir el acceso no autorizado, la alteración, pérdida o divulgación indebida de los datos almacenados en la plataforma. Estas medidas incluyen mecanismos de autenticación de usuarios, controles de acceso a la información, uso de protocolos de seguridad en la transmisión de datos, almacenamiento protegido de la información, monitoreo del sistema y actualizaciones periódicas de seguridad. Asimismo, se adoptan medidas administrativas y organizativas que buscan garantizar que el acceso a la información esté limitado únicamente a las personas autorizadas y que dicha información sea utilizada exclusivamente para los fines establecidos en esta política."
                : "As part of its commitment to information protection, Lumex implements various security measures aimed at preventing unauthorized access, alteration, loss or improper disclosure of data stored on the platform. These measures include user authentication mechanisms, access controls to information, use of security protocols in data transmission, protected storage of information, system monitoring and periodic security updates. Likewise, administrative and organizational measures are adopted to ensure that access to information is limited only to authorized persons and that such information is used exclusively for the purposes established in this policy."
              }
            </Text>

            <Text style={styles.subSectionTitle}>📌 {t('privacy.cookies')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "La aplicación puede emplear cookies o tecnologías similares cuando el servicio sea utilizado a través de plataformas web o integraciones tecnológicas. Las cookies son archivos que se almacenan en el dispositivo del usuario con el objetivo de mejorar la experiencia de navegación, registrar actividad dentro del sistema y permitir el análisis estadístico del uso de la plataforma. Estas tecnologías permiten reconocer preferencias de los usuarios y optimizar el funcionamiento del servicio. El usuario puede aceptar o rechazar el uso de cookies mediante la configuración de su navegador o dispositivo; sin embargo, la desactivación de estas herramientas podría afectar el funcionamiento de algunas funcionalidades del servicio."
                : "The application may use cookies or similar technologies when the service is used through web platforms or technological integrations. Cookies are files that are stored on the user's device with the aim of improving the browsing experience, recording activity within the system and allowing statistical analysis of platform usage. These technologies allow recognizing user preferences and optimizing service operation. The user can accept or reject the use of cookies through their browser or device settings; however, deactivating these tools could affect the operation of some service functionalities."
              }
            </Text>

            <Text style={styles.subSectionTitle}>📌 {t('privacy.thirdParty')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "La plataforma puede contener enlaces o integraciones con servicios de terceros que puedan resultar de interés para los usuarios. Una vez el usuario accede a dichos enlaces y abandona el entorno de Lumex, la plataforma deja de tener control sobre el sitio al que es redirigido. En consecuencia, Lumex no se hace responsable por las políticas de privacidad, prácticas de tratamiento de datos o condiciones de uso de dichos servicios externos. Se recomienda a los usuarios revisar las políticas de privacidad de los sitios o aplicaciones de terceros antes de proporcionar cualquier tipo de información personal."
                : "The platform may contain links or integrations with third-party services that may be of interest to users. Once the user accesses such links and leaves the Lumex environment, the platform no longer has control over the site to which they are redirected. Consequently, Lumex is not responsible for the privacy policies, data processing practices or conditions of use of such external services. Users are recommended to review the privacy policies of third-party sites or applications before providing any type of personal information."
              }
            </Text>

            <Text style={styles.subSectionTitle}>📌 {t('privacy.userRights')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Los usuarios tienen derecho a conocer, actualizar, rectificar y solicitar la eliminación de sus datos personales, así como a revocar la autorización otorgada para su tratamiento, de acuerdo con lo establecido en la Ley 1581 de 2012. De igual manera, los usuarios podrán limitar el uso de su información personal y decidir si desean recibir o no comunicaciones informativas o promocionales por parte de Lumex. Para ejercer estos derechos, los usuarios podrán utilizar los mecanismos de contacto y soporte disponibles dentro de la aplicación."
                : "Users have the right to know, update, rectify and request the deletion of their personal data, as well as to revoke the authorization granted for its processing, in accordance with the provisions of Law 1581 of 2012. Similarly, users may limit the use of their personal information and decide whether or not they wish to receive informational or promotional communications from Lumex. To exercise these rights, users may use the contact and support mechanisms available within the application."
              }
            </Text>

            <Text style={styles.subSectionTitle}>📌 {t('privacy.noSale')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex no venderá, cederá ni distribuirá la información personal recopilada a través de la aplicación sin el consentimiento previo del titular de los datos, salvo cuando dicha información sea requerida por una autoridad competente en cumplimiento de una orden judicial o una obligación legal. De igual manera, en algunos casos la información podrá ser compartida con proveedores tecnológicos o aliados que participen en la prestación del servicio, siempre garantizando que dichos terceros cumplan con estándares adecuados de protección de datos y confidencialidad."
                : "Lumex will not sell, assign or distribute the personal information collected through the application without the prior consent of the data subject, except when such information is required by a competent authority in compliance with a court order or legal obligation. Similarly, in some cases the information may be shared with technology providers or partners who participate in the provision of the service, always ensuring that such third parties comply with adequate data protection and confidentiality standards."
              }
            </Text>

            <Text style={styles.subSectionTitle}>📌 {t('privacy.noRetaliation')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex adopta además una Política de No Represalias, mediante la cual se garantiza que ningún usuario, profesional de la salud, colaborador o tercero será objeto de sanciones, discriminación o represalias por reportar de buena fe posibles irregularidades relacionadas con el tratamiento de datos personales, la seguridad de la información o el uso indebido de datos médicos dentro de la plataforma. Esta política se fundamenta en los principios de transparencia, ética y respeto por los derechos fundamentales reconocidos en la Constitución Política de Colombia y en la normativa vigente en materia de protección de datos personales. Los reportes o denuncias podrán realizarse a través de los canales establecidos por Lumex y serán tratados de manera confidencial, garantizando la protección de la identidad de quien realice la notificación cuando sea necesario."
                : "Lumex also adopts a Non-Retaliation Policy, which guarantees that no user, healthcare professional, collaborator or third party will be subject to sanctions, discrimination or retaliation for reporting in good faith possible irregularities related to the processing of personal data, information security or misuse of medical data within the platform. This policy is based on the principles of transparency, ethics and respect for the fundamental rights recognized in the Political Constitution of Colombia and in current regulations regarding the protection of personal data. Reports or complaints may be made through the channels established by Lumex and will be treated confidentially, guaranteeing the protection of the identity of the person making the notification when necessary."
              }
            </Text>

            <Text style={styles.subSectionTitle}>📌 {t('privacy.policyModifications')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex se reserva el derecho de modificar los términos de la presente Política de Privacidad y Seguridad de la Información en cualquier momento con el fin de adaptarla a cambios normativos, tecnológicos o funcionales del servicio. Cualquier modificación relevante será comunicada a los usuarios a través de la aplicación o mediante los canales oficiales de comunicación. El uso continuo de la aplicación después de la publicación de dichas modificaciones se entenderá como aceptación de los nuevos términos establecidos en esta política."
                : "Lumex reserves the right to modify the terms of this Privacy and Information Security Policy at any time in order to adapt it to regulatory, technological or functional changes in the service. Any relevant modification will be communicated to users through the application or through official communication channels. Continued use of the application after the publication of such modifications will be understood as acceptance of the new terms established in this policy."
              }
            </Text>
          </View>
        )}
      </View>

      {/* SECCIÓN 2: TÉRMINOS Y CONDICIONES DEL SERVICIO - COMPLETO */}
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('terminosCondiciones')}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="document-text-outline" size={18} color="#0f6d78" />
            </View>
            <Text style={styles.sectionTitle}>{t('privacy.termsConditions')}</Text>
          </View>
          <Ionicons
            name={expandedSection === 'terminosCondiciones' ? 'chevron-up' : 'chevron-forward'}
            size={16}
            color="#0f6d78"
          />
        </TouchableOpacity>

        {expandedSection === 'terminosCondiciones' && (
          <View style={styles.sectionContent}>
            <Text style={styles.subSectionTitle}>{t('terms.generalities')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex gestiona este sitio web y la aplicación móvil asociada. En todo el sitio y en la aplicación, los términos \"nosotros\", \"nos\" y \"nuestro\" se refieren en lo sucesivo a Lumex. Lumex ofrece esta plataforma digital, incluyendo toda la información, herramientas, funcionalidades y servicios que se ponen a disposición del usuario, siempre y cuando este acepte la totalidad de los términos, condiciones, políticas y avisos contemplados en el presente documento."
                : "Lumex manages this website and associated mobile application. Throughout the site and application, the terms \"we\", \"us\" and \"our\" refer to Lumex. Lumex offers this digital platform, including all information, tools, functionalities and services made available to the user, provided that the user accepts all the terms, conditions, policies and notices contemplated in this document."
              }
            </Text>

            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Al acceder, registrarse o utilizar la aplicación móvil, el sitio web o cualquiera de los servicios ofrecidos por Lumex, el usuario interactúa con nuestro \"Servicio\" y reconoce como vinculantes los siguientes términos y condiciones (denominados en lo sucesivo \"Términos del Servicio\" o \"Términos\"), incluidos aquellos términos y condiciones adicionales y políticas que se mencionan en este documento o que puedan estar disponibles por medio de hipervínculos dentro de la plataforma."
                : "By accessing, registering or using the mobile application, website or any of the services offered by Lumex, the user interacts with our \"Service\" and acknowledges as binding the following terms and conditions (hereinafter referred to as \"Terms of Service\" or \"Terms\"), including those additional terms and conditions and policies mentioned in this document or that may be available through hyperlinks within the platform."
              }
            </Text>

            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Estos Términos del Servicio se aplican a todos los usuarios de la plataforma, incluyendo de manera enunciativa mas no limitativa a pacientes, profesionales de la salud, visitantes, proveedores, clientes, colaboradores y cualquier persona que utilice o acceda a la aplicación o al sitio web."
                : "These Terms of Service apply to all users of the platform, including but not limited to patients, healthcare professionals, visitors, suppliers, clients, collaborators and any person who uses or accesses the application or website."
              }
            </Text>

            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex es una plataforma tecnológica orientada a la gestión y visualización de información médica, incluyendo el almacenamiento y consulta de resultados de exámenes médicos, interacción entre pacientes y profesionales de la salud y acceso a servicios digitales relacionados con la gestión de información clínica. Lumex no reemplaza la atención médica presencial ni constituye un servicio de diagnóstico médico automatizado. Las decisiones médicas deben ser tomadas exclusivamente por profesionales de la salud debidamente habilitados."
                : "Lumex is a technological platform oriented to the management and visualization of medical information, including storage and consultation of medical test results, interaction between patients and healthcare professionals and access to digital services related to clinical information management. Lumex does not replace in-person medical care nor constitutes an automated medical diagnosis service. Medical decisions must be made exclusively by duly qualified healthcare professionals."
              }
            </Text>

            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lea estos Términos del Servicio detenidamente antes de acceder o utilizar cualquier parte de la plataforma. Al acceder o utilizar el sitio web, la aplicación móvil o cualquiera de sus funcionalidades, usted acepta estos Términos del Servicio. Si no acepta la totalidad de los términos y condiciones de este acuerdo, no podrá acceder ni utilizar los servicios ofrecidos por Lumex."
                : "Please read these Terms of Service carefully before accessing or using any part of the platform. By accessing or using the website, mobile application or any of its functionalities, you accept these Terms of Service. If you do not accept all the terms and conditions of this agreement, you may not access or use the services offered by Lumex."
              }
            </Text>

            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Las nuevas funciones o herramientas que se agreguen a la plataforma también estarán sujetas a los presentes Términos del Servicio. Lumex se reserva el derecho de actualizar, modificar o reemplazar cualquier parte de estos Términos mediante la publicación de actualizaciones en la plataforma. Es responsabilidad del usuario revisar periódicamente este documento. El uso continuo del servicio después de la publicación de cambios constituye la aceptación de dichos cambios."
                : "New features or tools that are added to the platform will also be subject to these Terms of Service. Lumex reserves the right to update, modify or replace any part of these Terms by posting updates on the platform. It is the user's responsibility to periodically review this document. Continued use of the service after the publication of changes constitutes acceptance of such changes."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section1')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Al aceptar estos Términos del Servicio, el usuario declara que es mayor de edad según la legislación aplicable en su lugar de residencia o que cuenta con autorización de su representante legal para utilizar la plataforma. El usuario se compromete a utilizar la plataforma únicamente para fines legales y conforme a la normativa vigente. No está permitido utilizar el servicio para fines fraudulentos, ilegales o no autorizados, ni para infringir leyes locales, nacionales o internacionales. En el caso de los profesionales de la salud que utilicen la plataforma, estos declaran que cuentan con la habilitación profesional correspondiente según la normativa colombiana y que actuarán conforme a los principios éticos y legales que rigen el ejercicio de la medicina, incluyendo el respeto al secreto profesional médico. El incumplimiento de cualquiera de estos términos podrá dar lugar a la suspensión o cancelación inmediata del acceso a la plataforma."
                : "By accepting these Terms of Service, the user declares that they are of legal age according to the applicable legislation in their place of residence or that they have authorization from their legal representative to use the platform. The user agrees to use the platform only for legal purposes and in accordance with current regulations. It is not permitted to use the service for fraudulent, illegal or unauthorized purposes, nor to violate local, national or international laws. In the case of healthcare professionals who use the platform, they declare that they have the corresponding professional qualification according to Colombian regulations and that they will act in accordance with the ethical and legal principles governing the practice of medicine, including respect for medical professional secrecy. Failure to comply with any of these terms may result in immediate suspension or cancellation of access to the platform."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section2')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex se reserva el derecho de rechazar o suspender el acceso al servicio a cualquier persona en cualquier momento cuando se detecte un uso indebido del sistema o una violación de los presentes términos. El usuario entiende que ciertos contenidos que transmite a través del servicio pueden implicar transferencias a través de diversas redes y adaptaciones técnicas necesarias para permitir la comunicación entre sistemas y dispositivos. La información sensible, especialmente la información médica y datos personales, será tratada conforme a las políticas de privacidad y seguridad implementadas por Lumex y de acuerdo con la legislación colombiana vigente en materia de protección de datos personales. El usuario acepta no reproducir, duplicar, copiar, vender, revender o explotar cualquier parte del servicio sin autorización expresa por escrito de Lumex."
                : "Lumex reserves the right to reject or suspend access to the service to any person at any time when misuse of the system or violation of these terms is detected. The user understands that certain content transmitted through the service may involve transfers through various networks and technical adaptations necessary to enable communication between systems and devices. Sensitive information, especially medical information and personal data, will be processed in accordance with the privacy and security policies implemented by Lumex and in accordance with current Colombian legislation on personal data protection. The user agrees not to reproduce, duplicate, copy, sell, resell or exploit any part of the service without express written authorization from Lumex."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section3')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "La información disponible en la plataforma se proporciona con fines informativos y de gestión de datos médicos. Aunque Lumex realiza esfuerzos razonables para mantener la información actualizada y precisa, no garantiza que todo el contenido sea completamente exacto, completo o actualizado en todo momento. El usuario reconoce que la información disponible en la plataforma no reemplaza el criterio profesional de un médico ni constituye asesoría médica directa."
                : "The information available on the platform is provided for informational and medical data management purposes. Although Lumex makes reasonable efforts to keep information updated and accurate, it does not guarantee that all content is completely accurate, complete or up-to-date at all times. The user acknowledges that the information available on the platform does not replace the professional judgment of a physician nor constitutes direct medical advice."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section4')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex se reserva el derecho de modificar, actualizar, suspender o interrumpir el servicio o cualquiera de sus funcionalidades en cualquier momento y sin previo aviso. Asimismo, Lumex podrá introducir mejoras tecnológicas, cambios en la estructura del servicio o modificaciones en los servicios ofrecidos con el fin de mejorar la experiencia del usuario o cumplir con requisitos legales."
                : "Lumex reserves the right to modify, update, suspend or interrupt the service or any of its functionalities at any time and without prior notice. Likewise, Lumex may introduce technological improvements, changes in the service structure or modifications to the services offered in order to improve the user experience or comply with legal requirements."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section5')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Los servicios ofrecidos por Lumex pueden incluir funcionalidades relacionadas con la visualización, almacenamiento y gestión de información médica, como resultados de exámenes clínicos, historial de consultas o interacción entre pacientes y profesionales de la salud. Lumex actúa como intermediario tecnológico para facilitar el acceso y gestión de información médica, pero no es responsable del contenido clínico generado por laboratorios, profesionales médicos o instituciones de salud que utilicen la plataforma. No garantizamos que cualquier servicio disponible en la plataforma cumpla con expectativas específicas del usuario ni que el sistema esté libre de errores técnicos en todo momento."
                : "The services offered by Lumex may include functionalities related to the visualization, storage and management of medical information, such as clinical test results, consultation history or interaction between patients and healthcare professionals. Lumex acts as a technological intermediary to facilitate access and management of medical information, but is not responsible for the clinical content generated by laboratories, medical professionals or health institutions that use the platform. We do not guarantee that any service available on the platform meets specific user expectations or that the system is free of technical errors at all times."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section6')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "El usuario se compromete a proporcionar información completa, veraz y actualizada al momento de registrarse en la plataforma. Asimismo, acepta actualizar sus datos cuando sea necesario para garantizar el correcto funcionamiento del servicio. Lumex no será responsable por problemas derivados del suministro de información falsa, incompleta o desactualizada por parte del usuario."
                : "The user agrees to provide complete, truthful and updated information at the time of registering on the platform. Likewise, they agree to update their data when necessary to ensure the correct functioning of the service. Lumex will not be responsible for problems arising from the supply of false, incomplete or outdated information by the user."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section7')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "La plataforma puede integrar herramientas, servicios o funcionalidades proporcionadas por terceros. Dichas herramientas se ofrecen \"tal como están\" y Lumex no asume responsabilidad por su funcionamiento, disponibilidad o condiciones de uso. El uso de herramientas de terceros se realiza bajo responsabilidad del usuario y conforme a los términos establecidos por dichos proveedores."
                : "The platform may integrate tools, services or functionalities provided by third parties. Such tools are offered \"as is\" and Lumex assumes no responsibility for their operation, availability or conditions of use. The use of third-party tools is at the user's own risk and in accordance with the terms established by such providers."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section8')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "El servicio puede contener enlaces a sitios web o servicios externos que no están controlados por Lumex. Lumex no es responsable del contenido, políticas o prácticas de privacidad de dichos servicios externos. Se recomienda a los usuarios revisar las políticas y condiciones de uso de cualquier sitio de terceros antes de interactuar con ellos."
                : "The service may contain links to external websites or services that are not controlled by Lumex. Lumex is not responsible for the content, policies or privacy practices of such external services. Users are recommended to review the policies and conditions of use of any third-party site before interacting with them."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section9')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Los usuarios pueden enviar comentarios, sugerencias o comunicaciones relacionadas con el servicio. Al enviar este tipo de contenido, el usuario autoriza a Lumex a utilizarlo para mejorar la plataforma, sin que exista obligación de compensación económica. El usuario es responsable del contenido que publique o comparta a través del servicio y se compromete a no publicar material ilegal, ofensivo, difamatorio o que infrinja derechos de terceros."
                : "Users may send comments, suggestions or communications related to the service. By sending this type of content, the user authorizes Lumex to use it to improve the platform, without any obligation of financial compensation. The user is responsible for the content they post or share through the service and agrees not to post illegal, offensive, defamatory material or material that infringes on third-party rights."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section10')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "El tratamiento de la información personal recopilada a través de la plataforma se rige por la Política de Privacidad y Seguridad de la Información de Lumex, la cual establece los procedimientos para la recolección, uso, almacenamiento y protección de los datos personales de los usuarios, conforme a la Ley 1581 de 2012 de protección de datos personales en Colombia y demás normas aplicables."
                : "The processing of personal information collected through the platform is governed by Lumex's Privacy and Information Security Policy, which establishes the procedures for the collection, use, storage and protection of users' personal data, in accordance with Law 1581 of 2012 on personal data protection in Colombia and other applicable regulations."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section11')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "La plataforma puede contener errores tipográficos, inexactitudes u omisiones relacionadas con descripciones de servicios, funcionalidades o disponibilidad del sistema. Lumex se reserva el derecho de corregir dichos errores o actualizar información en cualquier momento."
                : "The platform may contain typographical errors, inaccuracies or omissions related to descriptions of services, functionalities or system availability. Lumex reserves the right to correct such errors or update information at any time."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section12')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Se prohíbe utilizar la plataforma para:"
                : "It is prohibited to use the platform for:"
              }
            </Text>
            <View style={styles.listContainer}>
              <Text style={styles.listItem}>• {i18n.language === 'es' ? "Realizar actividades ilegales o fraudulentas" : "Carry out illegal or fraudulent activities"}</Text>
              <Text style={styles.listItem}>• {i18n.language === 'es' ? "Infringir derechos de propiedad intelectual" : "Infringe intellectual property rights"}</Text>
              <Text style={styles.listItem}>• {i18n.language === 'es' ? "Difundir información falsa o engañosa" : "Disseminate false or misleading information"}</Text>
              <Text style={styles.listItem}>• {i18n.language === 'es' ? "Acceder sin autorización a sistemas o datos" : "Access systems or data without authorization"}</Text>
              <Text style={styles.listItem}>• {i18n.language === 'es' ? "Interferir con la seguridad o funcionamiento del servicio" : "Interfere with the security or operation of the service"}</Text>
              <Text style={styles.listItem}>• {i18n.language === 'es' ? "Recopilar información personal de otros usuarios sin autorización" : "Collect personal information from other users without authorization"}</Text>
              <Text style={styles.listItem}>• {i18n.language === 'es' ? "Distribuir software malicioso, virus o código dañino" : "Distribute malicious software, viruses or harmful code"}</Text>
            </View>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex podrá suspender o cancelar el acceso de cualquier usuario que incumpla estas disposiciones."
                : "Lumex may suspend or cancel access for any user who violates these provisions."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section13')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex no garantiza que el servicio estará disponible de manera continua, segura o libre de errores. El uso de la plataforma se realiza bajo responsabilidad del usuario. Lumex no será responsable por daños directos o indirectos derivados del uso del servicio, incluyendo pérdida de datos, interrupciones del sistema o decisiones médicas tomadas a partir de la información disponible en la plataforma. Lumex no sustituye la relación médico-paciente ni presta servicios médicos directos, salvo cuando se indique expresamente mediante profesionales habilitados."
                : "Lumex does not guarantee that the service will be available continuously, securely or error-free. The use of the platform is at the user's own risk. Lumex will not be liable for direct or indirect damages arising from the use of the service, including data loss, system interruptions or medical decisions made based on the information available on the platform. Lumex does not replace the doctor-patient relationship nor provide direct medical services, unless expressly indicated by qualified professionals."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section14')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "El usuario acepta indemnizar y mantener indemne a Lumex, sus directivos, empleados, colaboradores y afiliados frente a cualquier reclamación, demanda o gasto derivado del incumplimiento de estos Términos del Servicio o del uso indebido de la plataforma."
                : "The user agrees to indemnify and hold harmless Lumex, its officers, employees, collaborators and affiliates from any claim, demand or expense arising from breach of these Terms of Service or misuse of the platform."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section15')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Si alguna disposición de estos Términos del Servicio se considera ilegal o inaplicable, dicha disposición se interpretará de la manera más cercana posible a su intención original conforme a la legislación vigente, sin afectar la validez del resto del documento."
                : "If any provision of these Terms of Service is deemed illegal or unenforceable, such provision shall be interpreted as closely as possible to its original intent in accordance with current legislation, without affecting the validity of the remainder of the document."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section16')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "El presente acuerdo permanecerá vigente mientras el usuario utilice la plataforma. Lumex podrá suspender o cancelar el acceso al servicio en cualquier momento si se detecta un incumplimiento de estos términos o un uso indebido del sistema. El usuario también podrá dejar de utilizar el servicio en cualquier momento eliminando su cuenta o cesando el uso de la aplicación."
                : "This agreement will remain in effect while the user uses the platform. Lumex may suspend or cancel access to the service at any time if a breach of these terms or misuse of the system is detected. The user may also stop using the service at any time by deleting their account or ceasing use of the application."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.section17')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Estos Términos del Servicio se regirán e interpretarán de conformidad con las leyes de la República de Colombia. Cualquier controversia que surja en relación con el uso del servicio será resuelta conforme a la legislación colombiana vigente."
                : "These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of Colombia. Any controversy arising in connection with the use of the service shall be resolved in accordance with current Colombian legislation."
              }
            </Text>

            <Text style={styles.subSectionTitle}>{t('terms.additionalClauses')}</Text>
            
            <Text style={styles.subSubSectionTitle}>{t('terms.medicalWarning')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "La información disponible en Lumex tiene fines informativos y de gestión de datos de salud. La plataforma no sustituye la relación médico-paciente, ni debe utilizarse como base exclusiva para tomar decisiones médicas sin consultar a un profesional de la salud. En caso de emergencia médica, el usuario debe acudir inmediatamente a un servicio de salud o contactar a las autoridades sanitarias correspondientes."
                : "The information available on Lumex is for informational and health data management purposes. The platform does not replace the doctor-patient relationship, nor should it be used as the sole basis for making medical decisions without consulting a healthcare professional. In case of medical emergency, the user must immediately go to a health service or contact the corresponding health authorities."
              }
            </Text>

            <Text style={styles.subSubSectionTitle}>{t('terms.securityInfo')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Lumex implementa medidas de seguridad técnicas, administrativas y organizativas destinadas a proteger la información de los usuarios contra accesos no autorizados, alteración o pérdida. Sin embargo, el usuario reconoce que ningún sistema informático es completamente seguro y acepta los riesgos inherentes al uso de tecnologías digitales."
                : "Lumex implements technical, administrative and organizational security measures aimed at protecting user information against unauthorized access, alteration or loss. However, the user acknowledges that no computer system is completely secure and accepts the risks inherent in the use of digital technologies."
              }
            </Text>

            <Text style={styles.subSubSectionTitle}>{t('terms.regulatoryCompliance')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Los profesionales de la salud que utilicen la plataforma declaran cumplir con las normas éticas y legales aplicables a su profesión, incluyendo el respeto al secreto profesional médico y las obligaciones establecidas por la legislación sanitaria vigente."
                : "Healthcare professionals who use the platform declare that they comply with the ethical and legal standards applicable to their profession, including respect for medical professional secrecy and the obligations established by current health legislation."
              }
            </Text>

            <Text style={styles.subSubSectionTitle}>{t('terms.legalContact')}</Text>
            <Text style={styles.text}>
              {i18n.language === 'es'
                ? "Para consultas relacionadas con estos Términos del Servicio o con el tratamiento de datos personales, los usuarios podrán contactar a Lumex a través de los canales oficiales establecidos dentro de la plataforma."
                : "For inquiries related to these Terms of Service or the processing of personal data, users may contact Lumex through the official channels established within the platform."
              }
            </Text>
          </View>
        )}
      </View>

      {/* SECCIÓN 3: NORMATIVIDAD VIGENTE - COMPLETA */}
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('normatividad')}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="library-outline" size={18} color="#0f6d78" />
            </View>
            <Text style={styles.sectionTitle}>{t('privacy.regulations')}</Text>
          </View>
          <Ionicons
            name={expandedSection === 'normatividad' ? 'chevron-up' : 'chevron-forward'}
            size={16}
            color="#0f6d78"
          />
        </TouchableOpacity>

        {expandedSection === 'normatividad' && (
          <View style={styles.sectionContent}>
            <Text style={styles.text}>{t('regulations.description')}</Text>

            {/* Resolución 2238 de 2024 */}
            <TouchableOpacity 
              style={styles.policyItem}
              onPress={() => togglePolicy('res2238')}
              activeOpacity={0.7}
            >
              <View style={styles.policyHeader}>
                <Text style={styles.policyTitle}>{t('regulations.res2238')}</Text>
                <Ionicons name={expandedPolicy === 'res2238' ? 'chevron-up' : 'chevron-forward'} size={16} color="#0f6d78" />
              </View>
            </TouchableOpacity>

            {expandedPolicy === 'res2238' && (
              <View style={styles.policyContent}>
                <Text style={styles.policyDescription}>
                  {t('regulations.res2238Desc')}
                </Text>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => openPolicyLink(
                    "https://mintic.gov.co/portal/715/articles-2627_Resolucion_2238_de_2024.pdf",
                    t('regulations.res2238')
                  )}
                >
                  <Text style={styles.viewButtonText}>{t('regulations.viewFull')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Resolución 2239 de 2024 */}
            <TouchableOpacity 
              style={styles.policyItem}
              onPress={() => togglePolicy('res2239')}
              activeOpacity={0.7}
            >
              <View style={styles.policyHeader}>
                <Text style={styles.policyTitle}>{t('regulations.res2239')}</Text>
                <Ionicons name={expandedPolicy === 'res2239' ? 'chevron-up' : 'chevron-forward'} size={16} color="#0f6d78" />
              </View>
            </TouchableOpacity>

            {expandedPolicy === 'res2239' && (
              <View style={styles.policyContent}>
                <Text style={styles.policyDescription}>
                  {t('regulations.res2239Desc')}
                </Text>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => openPolicyLink(
                    "https://mintic.gov.co/portal/715/articles-2627_Resolucion_2239_de_2024.pdf",
                    t('regulations.res2239')
                  )}
                >
                  <Text style={styles.viewButtonText}>{t('regulations.viewFull')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Ley 1581 de 2012 */}
            <TouchableOpacity 
              style={styles.policyItem}
              onPress={() => togglePolicy('ley1581')}
              activeOpacity={0.7}
            >
              <View style={styles.policyHeader}>
                <Text style={styles.policyTitle}>{t('regulations.law1581')}</Text>
                <Ionicons name={expandedPolicy === 'ley1581' ? 'chevron-up' : 'chevron-forward'} size={16} color="#0f6d78" />
              </View>
            </TouchableOpacity>

            {expandedPolicy === 'ley1581' && (
              <View style={styles.policyContent}>
                <Text style={styles.policyDescription}>
                  {t('regulations.law1581Desc')}
                </Text>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => openPolicyLink(
                    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981",
                    t('regulations.law1581')
                  )}
                >
                  <Text style={styles.viewButtonText}>{t('regulations.viewFull')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Decreto 1377 de 2013 */}
            <TouchableOpacity 
              style={styles.policyItem}
              onPress={() => togglePolicy('decreto1377')}
              activeOpacity={0.7}
            >
              <View style={styles.policyHeader}>
                <Text style={styles.policyTitle}>{t('regulations.decree1377')}</Text>
                <Ionicons name={expandedPolicy === 'decreto1377' ? 'chevron-up' : 'chevron-forward'} size={16} color="#0f6d78" />
              </View>
            </TouchableOpacity>

            {expandedPolicy === 'decreto1377' && (
              <View style={styles.policyContent}>
                <Text style={styles.policyDescription}>
                  {t('regulations.decree1377Desc')}
                </Text>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => openPolicyLink(
                    "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646",
                    t('regulations.decree1377')
                  )}
                >
                  <Text style={styles.viewButtonText}>{t('regulations.viewFull')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Superintendencia de Industria y Comercio */}
            <TouchableOpacity 
              style={styles.policyItem}
              onPress={() => togglePolicy('sic')}
              activeOpacity={0.7}
            >
              <View style={styles.policyHeader}>
                <Text style={styles.policyTitle}>{t('regulations.sic')}</Text>
                <Ionicons name={expandedPolicy === 'sic' ? 'chevron-up' : 'chevron-forward'} size={16} color="#0f6d78" />
              </View>
            </TouchableOpacity>

            {expandedPolicy === 'sic' && (
              <View style={styles.policyContent}>
                <Text style={styles.policyDescription}>
                  {t('regulations.sicDesc')}
                </Text>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => openPolicyLink(
                    "https://www.sic.gov.co/proteccion-datos-personales",
                    t('regulations.sic')
                  )}
                >
                  <Text style={styles.viewButtonText}>{t('regulations.visitSite')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Ministerio de Tecnologías de la Información */}
            <TouchableOpacity 
              style={styles.policyItem}
              onPress={() => togglePolicy('mintic')}
              activeOpacity={0.7}
            >
              <View style={styles.policyHeader}>
                <Text style={styles.policyTitle}>{i18n.language === 'es' ? "Ministerio TIC" : "MinTIC"}</Text>
                <Ionicons name={expandedPolicy === 'mintic' ? 'chevron-up' : 'chevron-forward'} size={16} color="#0f6d78" />
              </View>
            </TouchableOpacity>

            {expandedPolicy === 'mintic' && (
              <View style={styles.policyContent}>
                <Text style={styles.policyDescription}>
                  {i18n.language === 'es'
                    ? "Ministerio de Tecnologías de la Información y las Comunicaciones. Entidad encargada de la política de transformación digital y protección de datos en Colombia."
                    : "Ministry of Information and Communication Technologies. Entity in charge of digital transformation policy and data protection in Colombia."
                  }
                </Text>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => openPolicyLink(
                    "https://www.mintic.gov.co/",
                    i18n.language === 'es' ? "Ministerio TIC" : "MinTIC"
                  )}
                >
                  <Text style={styles.viewButtonText}>{i18n.language === 'es' ? "Ir al sitio web" : "Visit website"}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Aceptación */}
      <View style={styles.acceptanceCard}>
        <View style={styles.checkboxContainer}>
          <Checkbox 
            value={isChecked} 
            onValueChange={setChecked} 
            color={isChecked ? "#0f6d78" : undefined}
            style={styles.checkbox}
          />
          <Text style={styles.acceptanceText}>
            {t('privacy.acceptText')}
          </Text>
        </View>

        <Text style={styles.acceptanceNote}>
          {t('privacy.acceptNote')}
        </Text>
      </View>

      {/* Botones */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            { backgroundColor: isChecked ? "#0f6d78" : "#c8d8dc" }
          ]}
          disabled={!isChecked}
          onPress={() => navigation.navigate(route.params?.returnTo || "Register", { 
            formData: route.params?.formData, 
            accepted: true 
          })}
        >
          <Text style={styles.acceptButtonText}>{t('privacy.acceptButton')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.replace("Login")}
        >
          <Text style={styles.cancelButtonText}>{t('privacy.declineButton')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        {t('privacy.version')}
      </Text>
    </ScrollView>
      <AccessQuickNav navigation={navigation} current="usuario" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eaf6f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#eaf6f5",
  },
  contentContainer: {
    paddingBottom: 110,
  },
  header: {
    backgroundColor: "#dff2f0",
    paddingTop: 40,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 10,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(15,109,120,0.12)',
    top: -100,
    right: -70,
  },
  headerTop: {
    position: 'absolute',
    top: 50,
    right: 15,
    zIndex: 10,
  },
  logoWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  logoGlowLarge: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(15, 109, 120, 0.08)',
  },
  logoGlowSmall: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: 'rgba(15, 109, 120, 0.14)',
  },
  logoFrame: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 2,
    shadowColor: '#0f6d78',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 1,
  },
  mainTitle: {
    color: "#15333d",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  subTitle: {
    color: "#3d646b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 12,
    marginBottom: 9,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#083a42",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#f7fcfd",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0f1f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e3e45",
    flex: 1,
  },
  sectionContent: {
    padding: 14,
    backgroundColor: "#fcfeff",
    borderTopWidth: 1,
    borderTopColor: "#d7e8ec",
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f6d78",
    marginTop: 10,
    marginBottom: 6,
  },
  subSubSectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#355861",
    marginTop: 8,
    marginBottom: 4,
  },
  text: {
    fontSize: 12,
    color: "#4a6067",
    lineHeight: 18,
    marginBottom: 9,
    textAlign: "justify",
  },
  listContainer: {
    marginLeft: 12,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 11,
    color: "#4a6067",
    lineHeight: 18,
    marginBottom: 3,
  },
  policyItem: {
    borderTopWidth: 1,
    borderTopColor: "#d7e8ec",
    paddingVertical: 9,
  },
  policyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e3e45",
  },
  policyContent: {
    backgroundColor: "#f2f9fb",
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 3,
  },
  policyDescription: {
    fontSize: 11,
    color: "#4f666c",
    lineHeight: 15,
    marginBottom: 8,
    fontStyle: "normal",
  },
  viewButton: {
    backgroundColor: "#0f6d78",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  viewButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  acceptanceCard: {
    backgroundColor: "#eaf5f8",
    marginHorizontal: 12,
    marginTop: 3,
    marginBottom: 9,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#c8e3e9",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
  },
  checkbox: {
    marginRight: 10,
    marginTop: 1,
  },
  acceptanceText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "bold",
    color: "#1e3e45",
    lineHeight: 18,
  },
  acceptanceNote: {
    fontSize: 10,
    color: "#4f666c",
    lineHeight: 14,
    textAlign: "justify",
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
  },
  buttonsContainer: {
    marginHorizontal: 12,
    marginTop: 3,
    marginBottom: 12,
  },
  acceptButton: {
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 7,
  },
  acceptButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#4f666c",
    padding: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    fontSize: 10,
    color: "#6f8389",
    marginBottom: 10,
  },
});