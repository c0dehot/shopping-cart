import React, { Suspense } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { StoreProvider } from './utils/GlobalStore'

import NavBar from './components/NavBar'
import Footer from './components/Footer'
import AlertBar from './components/AlertBar'
import DisplayTweaks from './components/DisplayTweaks'
import Loader from './components/Loader'

// user signup
import Login from './pages/Login'
import Logout from './pages/Logout'
// pages client
import Menu from './pages/Menu'
import Index from './pages/Index'

// lazy load slow/infrequently used items
const Terms = React.lazy( () => import('./pages/Terms') )
const Privacy = React.lazy( () => import('./pages/Privacy') )
const Order = React.lazy( () => import('./pages/Order') )
const Signup = React.lazy( () => import('./pages/Signup') )
const SignupDetails = React.lazy( () => import('./pages/SignupDetails') )
const Contact = React.lazy( () => import('./pages/Contact') )
const Unsubscribe = React.lazy( () => import('./pages/Unsubscribe') )

// pages admin
const Categories = React.lazy( () => import('./pages/admin/SettingsCategories') )
const Items = React.lazy( () => import('./pages/admin/Items') )
const Info = React.lazy( () => import('./pages/admin/Info') )
const ItemsEdit = React.lazy( () => import('./pages/admin/ItemsEdit') )
const SettingsUser = React.lazy( () => import('./pages/admin/SettingsUser') )
const SettingsOrg = React.lazy( () => import('./pages/admin/SettingsOrg') )
const SettingsFinancial = React.lazy( () => import('./pages/admin/SettingsFinancial') )
const SettingsAffiliate = React.lazy( () => import('./pages/admin/SettingsAffiliate') )
const SuperOverview = React.lazy( () => import('./pages/admin/SuperOverview') )
const Orders = React.lazy( () => import('./pages/admin/Orders') )

function App() {
   return (
      <StoreProvider>
         <BrowserRouter>
            <DisplayTweaks>   
               <AlertBar />
               <NavBar />
               <Suspense fallback={<Loader />}>
                  <Switch>
                     <Route exact path="/admin/orders/:orderStatus" component={Orders} />
                     <Route exact path="/admin/categories" component={Categories} />
                     <Route exact path="/admin/info" component={Info} />
                     <Route exact path="/admin/items" component={Items} />
                     <Route exact path="/admin/items/:id" component={ItemsEdit} />
                     <Route exact path="/admin/settings/user" component={SettingsUser} />
                     <Route exact path="/admin/settings/org" component={SettingsOrg} />
                     <Route exact path="/admin/settings/affiliate" component={SettingsAffiliate} />
                     <Route exact path="/admin/settings/financial" component={SettingsFinancial} />
                     <Route exact path="/admin/superoverview" component={SuperOverview} />

                     <Route exact path="/signup/:refCode?" component={Signup} />
                     <Route exact path="/signup-details" component={SignupDetails} />
                     <Route exact path="/login" component={Login} />
                     <Route exact path="/logout" component={Logout} />
                     <Route exact path="/" component={Index} />
                     <Route exact path="/contact/:type?" component={Contact} />
                     <Route exact path="/terms" component={Terms} />
                     <Route exact path="/privacy" component={Privacy} />
                     <Route exact path="/unsubscribe/:email?/:code?" component={Unsubscribe} />

                     
                     {/* <Route exact path="/" component={Cart} /> */}
                     <Route exact path="/:restoUrl" component={Menu} />
                     <Route exact path="/:restoUrl/order/:orderResult?" component={Order} />
                     {/* <Route exact path="/:resto/order" component={Menu} />
                     <Route exact path="/:resto/help" component={Help} /> */}
                  </Switch>
               </Suspense>
               <Footer />
            </DisplayTweaks>
         </BrowserRouter>
      </StoreProvider>
   )
}

export default App