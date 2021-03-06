import React from 'react'
import styled from 'styled-components'
import axios from 'axios'

import LinkItem from './LinkItem'
import FirebaseContext from '../../firebase/context'
import { LINKS_PER_PAGE } from '../../utils/index'

function LinkList(props) {
  const { firebase } = React.useContext(FirebaseContext)

  const [links, setLinks] = React.useState([])
  const [cursor, setCursor] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [totalLinks, setTotalLinks] = React.useState(0)

  const isNewPage = props.location.pathname.includes('new')
  const isTopPage = props.location.pathname.includes('top')

  const page = Number(props.match.params.page)
  const linksRef = firebase.db.collection('links')

  React.useEffect(() => {
    getTotalLinks()
  }, [])

  React.useEffect(() => {
    const unsubscribe = getLinks()
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTopPage, page])

  const getLinks = () => {
    const hasCursor = Boolean(cursor)
    setLoading(true)

    if (isTopPage) {
      return linksRef
        .orderBy('voteCount', 'desc')
        .limit(LINKS_PER_PAGE)
        .onSnapshot(handleSnapshot)
    } else if (page === 1) {
      return linksRef
        .orderBy('created', 'desc')
        .limit(LINKS_PER_PAGE)
        .onSnapshot(handleSnapshot)
    } else if (hasCursor && page !== 2) {
      return linksRef
        .orderBy('created', 'desc')
        .startAfter(cursor.created)
        .limit(LINKS_PER_PAGE)
        .onSnapshot(handleSnapshot)
    } else {
      const offset = page * LINKS_PER_PAGE - LINKS_PER_PAGE
      axios
        .get(
          `https://us-central1-hacker-news-clone-d96d7.cloudfunctions.net/linkPagination?offset=${offset}`
        )
        .then(response => {
          const links = response.data
          const lastLink = links[links.length - 1]
          setLinks(links)
          setCursor(lastLink)
          setLoading(false)
        })
      return () => {}
    }
  }

  const getTotalLinks = () => {
    axios
      .get(
        'https://us-central1-hacker-news-clone-d96d7.cloudfunctions.net/getTotalLinks'
      )
      .then(response => {
        setTotalLinks(response.data.length)
      })
  }

  const handleSnapshot = snapshot => {
    const links = snapshot.docs.map(doc => {
      return { id: doc.id, ...doc.data() }
    })
    const lastLink = links[links.length - 1]
    setLinks(links)
    setCursor(lastLink)
    setLoading(false)
  }

  const visitPreviousPage = () => {
    if (page > 1) {
      props.history.push(`/new/${page - 1}`)
    }
  }
  const visitNextPage = () => {
    if (page <= totalLinks / LINKS_PER_PAGE) {
      props.history.push(`/new/${page + 1}`)
    }
  }

  const pageIndex = page ? (page - 1) * LINKS_PER_PAGE + 1 : 0

  return (
    <LinksContainer loading={loading ? 0.25 : 1}>
      {links.map((link, index) => (
        <LinkItem
          key={link.id}
          showCount={true}
          link={link}
          index={index + pageIndex}
        />
      ))}
      {isNewPage && (
        <Pagination>
          <Pointer onClick={visitPreviousPage}>Previous</Pointer>
          <Pointer onClick={visitNextPage}>Next</Pointer>
        </Pagination>
      )}
    </LinksContainer>
  )
}

const Pagination = styled.div`
  margin-top: 1re;
  margin-bottom: 1rem;
  margin-left: 2rem;
  color: #000;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
`

const Pointer = styled.div`
  margin-left: 1rem;
  &:hover {
    cursor: pointer;
  }
`

const LinksContainer = styled.div`
  opacity: ${props => props.loading};
  transition-duration: 0.3s;
`

export default LinkList
