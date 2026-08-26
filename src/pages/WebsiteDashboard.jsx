import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

const DEFAULT_PROJECTS = [
  {
    type: "site_web",
    category: "PRODUCTION AUDIOVISUELLE",
    title: "PixMove",
    description: "Agence de production audiovisuelle d'élite conjuguant approche journalistique et storytelling immersif pour concevoir des films corporate et motion design à fort impact.",
    image: "https://image.thum.io/get/width/3840/crop/3200/noanimate/https://www.pixmove.fr/",
    link: "https://www.pixmove.fr/",
    isExternal: true
  }
];

export const WebsiteDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState('site_web');
  const [newProjectType, setNewProjectType] = useState('site_web');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // UI Animations : Rejouer l'animation quand les projets ou l'onglet changent
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    // On attend que React ait rendu les nouveaux éléments dans le DOM
    const timeoutId = setTimeout(() => {
      document.querySelectorAll('.fade-in-up').forEach((element) => {
        // Force la réinitialisation de l'animation si on vient de changer d'onglet
        element.classList.remove('visible'); 
        observer.observe(element);
      });
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [projects, activeTab]);

  const fetchProjects = async () => {
    try {
      const q = query(collection(db, 'portfolioProjects'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setProjects(DEFAULT_PROJECTS);
      } else {
        const fetchedProjects = [];
        querySnapshot.forEach((doc) => {
          fetchedProjects.push({ id: doc.id, ...doc.data() });
        });
        // S'assurer que le projet par défaut PixMove reste affiché s'il n'a pas été sauvegardé manuellement
        const hasPixmove = fetchedProjects.some(p => p.link && p.link.includes("pixmove.fr"));
        if (!hasPixmove) {
          fetchedProjects.push(...DEFAULT_PROJECTS);
        }
        setProjects(fetchedProjects);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setProjects(DEFAULT_PROJECTS);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newUrl) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      // Use Microlink API to fetch metadata and screenshot
      const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(newUrl)}&screenshot=true&meta=true`);
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error("Impossible de récupérer les données du site.");
      }
      
      const { title, description, publisher } = data.data;
      
      const newProject = {
        type: newProjectType,
        category: publisher || (newProjectType === 'graphisme' ? "CRÉATION GRAPHIQUE" : "CLIENT PREMIUM"),
        title: title || newUrl.replace(/^https?:\/\//, '').split('/')[0],
        description: description || (newProjectType === 'graphisme' ? "Découvre notre dernière réalisation graphique et identité visuelle." : "Développement et intégration web sur-mesure."),
        image: `https://image.thum.io/get/width/3840/crop/3200/noanimate/${newUrl}`,
        link: newUrl,
        isExternal: true,
        createdAt: serverTimestamp()
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'portfolioProjects'), newProject);
      
      // Update local state
      setProjects([{ id: docRef.id, ...newProject, createdAt: new Date() }, ...projects]);
      setNewUrl('');
      
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur lors de l'ajout.");
    } finally {
      setIsAdding(false);
    }
  };

  const displayedProjects = projects.filter(p => (p.type || 'site_web') === activeTab);

  return (
    <div className="font-body-md text-body-md antialiased selection:bg-primary-container selection:text-white bg-transparent text-gray-900 dark:text-on-surface w-full transition-colors duration-300">
      
      {/* Main Content */}
      <main className="pt-[60px] md:pt-[100px]">
        
        {/* Section 1: Hero */}
        <section className="relative min-h-[70vh] flex items-center justify-center px-margin-mobile md:px-margin-desktop overflow-hidden">
          <div className="hero-glow dark:opacity-100 opacity-30"></div>
          <div className="relative z-10 max-w-container-max mx-auto text-center fade-in-up">
            
            <h1 className="font-display-lg-mobile md:font-display-lg text-[40px] leading-[48px] md:text-display-lg text-gray-900 dark:text-on-surface mb-8 max-w-4xl mx-auto tracking-tight transition-colors duration-300">
              Karam Agency : <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-primary dark:to-inverse-primary">
                L'Excellence du Craft Digital
              </span>
            </h1>
            
            <p className="font-body-lg text-body-lg text-gray-600 dark:text-on-surface-variant max-w-2xl mx-auto mb-12 transition-colors duration-300">
              Nous concevons des expériences numériques sur mesure pour des marques d'exception. Une fusion parfaite entre design minimaliste, ingénierie de précision et esthétique contemporaine.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="https://www.karam-agency.com/" target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 dark:bg-primary-container dark:hover:bg-indigo-700 text-white px-8 py-4 rounded font-label-caps text-label-caps transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] dark:shadow-[0_0_20px_rgba(79,70,206,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] dark:hover:shadow-[0_0_30px_rgba(79,70,206,0.5)] flex items-center gap-2">
                VISITER KARAM AGENCY
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
            </div>

          </div>
        </section>

        {/* Section 2: Portfolio Grid */}
        <section className="py-section-gap px-margin-mobile md:px-margin-desktop bg-transparent transition-colors duration-300" id="realisations">
          <div className="max-w-container-max mx-auto">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 fade-in-up gap-8">
              <div>
                <h2 className="font-headline-lg text-[32px] md:text-headline-lg text-gray-900 dark:text-on-surface mb-2 transition-colors duration-300">Nos Réalisations</h2>
                <p className="font-body-md text-body-md text-gray-600 dark:text-on-surface-variant transition-colors duration-300">Une sélection de nos projets les plus récents et emblématiques.</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-glass-stroke rounded-lg self-start">
                <button 
                  onClick={() => setActiveTab('graphisme')}
                  className={`px-6 py-2 rounded font-label-caps text-label-caps transition-colors ${
                    activeTab === 'graphisme' 
                    ? 'bg-[#0f0059] text-[#9b8dff]' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Graphisme
                </button>
                <button 
                  onClick={() => setActiveTab('site_web')}
                  className={`px-6 py-2 rounded font-label-caps text-label-caps transition-colors ${
                    activeTab === 'site_web' 
                    ? 'bg-[#0f0059] text-[#9b8dff]' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Site web
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {displayedProjects.length > 0 ? (
                displayedProjects.map((project, index) => (
                  <div key={project.id || index} className={`project-card group relative rounded-lg overflow-hidden border border-gray-200 dark:border-glass-stroke bg-transparent shadow-lg dark:shadow-none fade-in-up cursor-pointer h-[500px] transition-colors duration-300 ${index % 2 !== 0 ? 'md:mt-16' : ''}`}>
                    <div className="absolute inset-0 overflow-hidden">
                      <img alt={project.title} className="w-full h-full object-cover object-top transition-transform duration-700 ease-out project-image opacity-90 dark:opacity-80" src={project.image} />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 dark:from-[#0A0A0A] dark:via-[#0A0A0A]/80 to-transparent opacity-80 dark:opacity-100"></div>
                    </div>
                    <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <span className="font-label-caps text-label-caps text-blue-400 dark:text-primary mb-2 block uppercase">{project.category}</span>
                        <h3 className="font-headline-md text-headline-md text-white dark:text-on-surface mb-4">{project.title}</h3>
                        <p className="font-body-md text-body-md text-gray-200 dark:text-on-surface-variant mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="project-overlay opacity-0 transition-opacity duration-500 delay-200">
                          <a href={project.link} target={project.isExternal ? "_blank" : "_self"} rel="noreferrer" className="glass-panel px-6 py-3 rounded font-label-caps text-label-caps text-white hover:bg-white/20 transition-colors inline-flex items-center gap-2">
                            VOIR LE PROJET
                            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 text-center py-20 text-gray-500 dark:text-gray-400 font-body-lg">
                  Aucun projet dans cette catégorie pour le moment. Ajoute-en un ci-dessous !
                </div>
              )}
            </div>
            
            {/* Admin Add Project Form */}
            <div className="mt-24 p-8 border border-gray-200 dark:border-glass-stroke rounded-xl bg-white/50 dark:bg-surface/50 backdrop-blur-xl fade-in-up">
              <h3 className="font-headline-md text-headline-md text-gray-900 dark:text-on-surface mb-2">Ajouter une nouvelle réalisation</h3>
              <p className="font-body-md text-body-md text-gray-600 dark:text-on-surface-variant mb-6">Colle l'URL du site ou du projet graphique que tu as créé. L'IA se chargera du reste.</p>
              
              <form onSubmit={handleAddProject} className="flex flex-col gap-4">
                
                <div className="flex gap-6 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-900 dark:text-white font-body-md">
                    <input 
                      type="radio" 
                      name="projectType" 
                      value="site_web" 
                      checked={newProjectType === 'site_web'} 
                      onChange={() => setNewProjectType('site_web')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Site Web
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-900 dark:text-white font-body-md">
                    <input 
                      type="radio" 
                      name="projectType" 
                      value="graphisme" 
                      checked={newProjectType === 'graphisme'} 
                      onChange={() => setNewProjectType('graphisme')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Graphisme
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="url" 
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder={newProjectType === 'graphisme' ? "Lien Behance, Dribbble ou URL d'image" : "https://www.monsite.fr"} 
                    required
                    className="flex-1 bg-white dark:bg-[#0A0A0A] border border-gray-300 dark:border-glass-stroke rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-primary"
                  />
                  <button 
                    type="submit" 
                    disabled={isAdding}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-primary-container dark:hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-label-caps text-label-caps transition-colors disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    {isAdding ? 'ANALYSE EN COURS...' : 'INTÉGRER AU PORTFOLIO'}
                    {!isAdding && <span className="material-symbols-outlined text-[18px]">add</span>}
                  </button>
                </div>
              </form>
              {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
            </div>
            
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-section-gap bg-transparent border-t border-gray-200 dark:border-glass-stroke transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto gap-8">
          <div className="font-headline-md text-headline-md text-gray-900 dark:text-on-surface">Karam Agency</div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 font-label-caps text-label-caps">
            <a className="text-gray-600 dark:text-on-secondary-fixed-variant hover:text-blue-600 dark:hover:text-primary transition-colors duration-300 opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
            <a className="text-gray-600 dark:text-on-secondary-fixed-variant hover:text-blue-600 dark:hover:text-primary transition-colors duration-300 opacity-80 hover:opacity-100" href="#">Terms of Service</a>
          </div>
          <div className="font-label-caps text-label-caps text-gray-500 dark:text-on-surface-variant text-center md:text-right">
            © 2024 Karam Agency. Excellence in Digital Craftsmanship.
          </div>
        </div>
      </footer>
    </div>
  );
};
